import Foundation
import Vision
import UIKit
import ImageIO
import React

@objc(RNPriceOCR)
class RNPriceOCR: NSObject {

  @objc(ping:rejecter:)
  func ping(_ resolve: RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve("pong")
  }

  @objc(detectTextInImage:resolver:rejecter:)
  func detectTextInImage(_ uri: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    // --- Load image ---
 guard let (cgImage, orientation) = loadCGImage(uri, lightPreproc: false) else {
      reject("E_IMAGE", "Cannot load image at \(uri)", nil); return
    }
    // --- Vision request ---
    let req = VNRecognizeTextRequest { [weak self] r, e in
      guard let self = self else { return }
      if let e = e {
        reject("E_OCR", "Vision error: \(e.localizedDescription)", e)
        return
      }
      guard let obs = r.results as? [VNRecognizedTextObservation] else {
        resolve(self.emptyResult(width: cgImage.width, height: cgImage.height))
        return
      }

      var lines: [[String: Any]] = []
      var prices: [[String: Any]] = []

      // Currency/price regex (symbol or code optional)
      let priceRegex = try! NSRegularExpression(
        pattern: #"(?:(?:€|\$|£|RON|Ron|ron|LEI|Lei|lei)\s*)?-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|\$|£|RON|Ron|ron|LEI|Lei|lei)?"#,
        options: []
      )

      for (lineIndex, o) in obs.enumerated() {
        guard let cand = o.topCandidates(3).first else { continue }

        // Save whole line (debug / fallback)
        let lineRect = o.boundingBox
        lines.append([
          "text": cand.string,
          "box": self.rectToBox(rect: lineRect),
          "quad": self.rectToQuad(rect: lineRect),
          "lineIndex": lineIndex,
          "blockIndex": 0
        ])

        // --- Price spans on this line ---
        let ns = cand.string as NSString
        let whole = NSRange(location: 0, length: ns.length)

        priceRegex.enumerateMatches(in: cand.string, options: [], range: whole) { m, _, _ in
          guard let m = m, m.range.length > 0 else { return }

          // 1) the price box (tight, on this line)
          guard
            let priceSwift = Range(m.range, in: cand.string),
            let priceObs = try? cand.boundingBox(for: priceSwift)
          else { return }

          let priceRect = priceObs.boundingBox
          let priceText = ns.substring(with: m.range).trimmingCharacters(in: .whitespaces)

          // 2) text BEFORE the price on the SAME line -> label
          let beforeNS = NSRange(location: 0, length: m.range.location)
          var labelText = ""
          var labelRect: CGRect?

          if beforeNS.length > 0,
             let beforeSwift = Range(beforeNS, in: cand.string),
             let beforeObs = try? cand.boundingBox(for: beforeSwift) {

            labelRect = beforeObs.boundingBox

            // Trim trailing leaders/dashes/colons/spaces
            let rawLeft = ns.substring(with: beforeNS)
            labelText = rawLeft.replacingOccurrences(
              of: #"[ \t.\-·:•…]+$"#,
              with: "",
              options: .regularExpression
            )
          }

          var payload: [String: Any] = [
            "text": priceText,                          // "$7"
            "confidence": cand.confidence,
            "box": self.rectToBox(rect: priceRect),     // price box (normalized TL)
            "quad": self.rectToQuad(rect: priceRect),
            "lineIndex": lineIndex,
            "lineText": cand.string,                    // full OCR line
            "lineBox": self.rectToBox(rect: lineRect)
          ]

          if let lRect = labelRect,
             !labelText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            payload["labelText"] = labelText           // "Bruschetta"
            payload["labelBox"]  = self.rectToBox(rect: lRect)
          }

          prices.append(payload)
        }
      }

      // --- Fallback: if a price has no labelText, pair it with the best LEFT line (same row/column) ---
      func toCGRect(_ box: [String: Any]) -> CGRect {
        CGRect(
          x: box["x"] as! CGFloat,
          y: box["y"] as! CGFloat,
          width: box["width"] as! CGFloat,
          height: box["height"] as! CGFloat
        )
      }
      func verticalOverlapRatio(_ a: CGRect, _ b: CGRect) -> CGFloat {
        let y1 = max(a.minY, b.minY)
        let y2 = min(a.maxY, b.maxY)
        return max(0, y2 - y1) / max(1e-6, min(a.height, b.height))
      }

      for i in 0..<prices.count {
        let hasLabel = (prices[i]["labelText"] as? String)?
          .trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        if hasLabel { continue }

        guard let pBoxDict = prices[i]["box"] as? [String: Any] else { continue }
        let p = toCGRect(pBoxDict)

        var bestIdx: Int?
        var bestScore = CGFloat.greatestFiniteMagnitude

        for (j, line) in lines.enumerated() {
          guard let lBoxDict = line["box"] as? [String: Any] else { continue }
          let l = toCGRect(lBoxDict)

          // Same row-ish and clearly to the left
          let v = verticalOverlapRatio(p, l)
          guard v >= 0.55, l.maxX <= p.minX + 0.01 else { continue }

          // Penalize lines very far vertically; prefer small horizontal gap
          let dy = abs(p.midY - l.midY)
          let gap = max(0, p.minX - l.maxX)
          let score = dy * 2.2 + gap
          if score < bestScore {
            bestScore = score
            bestIdx = j
          }
        }

        if let idx = bestIdx {
          prices[i]["labelText"] = lines[idx]["text"]
          prices[i]["labelBox"]  = lines[idx]["box"]
        }
      }

      // --- Return ---
      resolve([
        "width": cgImage.width,
        "height": cgImage.height,
        "rotation": 0,
        "words": [] as [[String: Any]],
        "lines": lines,
        "prices": prices
      ])
    }

    // Tuning
    req.recognitionLevel = VNRequestTextRecognitionLevel.accurate
    req.usesLanguageCorrection = true
   if #available(iOS 16.0, *) {
      req.revision = VNRecognizeTextRequestRevision3
    }
    req.recognitionLanguages = ["en_US","ro_RO","es_ES"]
    req.minimumTextHeight = 0.004  // was 0.008; helps tiny glyphs
    if #available(iOS 15.0, *) {
      req.customWords = ["EUR","RON","LEI","lei","€","$","£"]
    } // 0.008–0.012 often best for menus

    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
    DispatchQueue.global(qos: .userInitiated).async {
      do { try handler.perform([req]) }
      catch { reject("E_OCR", "Perform failed: \(error.localizedDescription)", error) }
    }
  }
@objc(detectTextInImageLive:resolver:rejecter:)
func detectTextInImageLive(_ uri: String,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
  guard let load = self.loadCGImage(uri, lightPreproc: true) else {
    reject("E_IMAGE", "Cannot load image at \(uri)", nil); return
  }
  let (cgImage, orientation) = load

  let req = VNRecognizeTextRequest { [weak self] r, e in
    guard let self = self else { return }
    if let e = e { reject("E_OCR", "Vision error: \(e.localizedDescription)", e); return }
    guard let obs = r.results as? [VNRecognizedTextObservation] else {
      resolve(self.emptyResult(width: cgImage.width, height: cgImage.height)); return
    }
    resolve(self.packageResults(obs, width: cgImage.width, height: cgImage.height))
  }

  // 🔁 Live profile: favor accuracy (menus/price columns often small)
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = true
  if #available(iOS 16.0, *) { req.revision = VNRecognizeTextRequestRevision3 }
  req.recognitionLanguages = ["en_US","ro_RO","es_ES"]
  req.minimumTextHeight = 0.008

  // Optional: nudge the recognizer toward price tokens
  if #available(iOS 15.0, *) {
    req.customWords = ["EUR","RON","LEI","lei","€","$","£"]
  }

  // ❌ Remove ROI for now (it was clipping some lines)

  let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
  DispatchQueue.global(qos: .userInitiated).async {
    do { try handler.perform([req]) }
    catch { reject("E_OCR", "Perform failed: \(error.localizedDescription)", error) }
  }
}
  // MARK: - Helpers
private func upscaleIfNeeded(_ cg: CGImage, minSide: CGFloat = 1200) -> CGImage {
  let w = CGFloat(cg.width), h = CGFloat(cg.height)
  let s = min(w, h)
guard s < minSide else { return cg }
let ci = CIImage(cgImage: cg)
  let scale = minSide / s
  let filt = CIFilter(name: "CILanczosScaleTransform")!
  filt.setValue(ci, forKey: kCIInputImageKey)
  filt.setValue(scale, forKey: kCIInputScaleKey)
  filt.setValue(1.0,   forKey: kCIInputAspectRatioKey)
  let out = filt.outputImage!.applyingFilter("CISharpenLuminance", parameters: ["inputSharpness": 0.35])
  return CIContext().createCGImage(out, from: out.extent) ?? cg
}
  private func loadCGImage(_ uri: String, lightPreproc: Bool = false) -> (CGImage, CGImagePropertyOrientation)? {
    let fileURL = URL(string: uri.hasPrefix("file://") ? uri : "file://\(uri)")
    guard let url = fileURL,
          let uiImage = UIImage(contentsOfFile: url.path),
          let cgOriginal = uiImage.cgImage else { return nil }

let cgPre = self.preprocessedCGImage(from: uiImage)
let cgBase = cgPre ?? cgOriginal
let cgImage = self.upscaleIfNeeded(cgBase, minSide: 1200)
let orientation: CGImagePropertyOrientation = (cgPre != nil) ? .up : CGImagePropertyOrientation(uiImage.imageOrientation)
    return (cgImage, orientation)
  }

  private func emptyResult(width: Int, height: Int) -> [String: Any] {
    ["width": width, "height": height, "rotation": 0, "words": [], "lines": [], "prices": []]
  }

  // Vision gives normalized rect with origin at bottom-left; convert to top-left.
  private func rectToBox(rect: CGRect) -> [String: Any] {
    let x = rect.origin.x
    let y = 1.0 - rect.origin.y - rect.size.height
    return ["x": x, "y": y, "width": rect.size.width, "height": rect.size.height]
  }
private func packageResults(
  _ obs: [VNRecognizedTextObservation],
  width: Int,
  height: Int
) -> [String: Any] {

  var lines: [[String: Any]] = []
  var prices: [[String: Any]] = []

  let priceRegex = try! NSRegularExpression(
    pattern: #"(?:(?:€|\$|£|RON|Ron|ron|LEI|Lei|lei)\s*)?-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|\$|£|RON|Ron|ron|LEI|Lei|lei)?"#,
    options: []
  )

  for (lineIndex, o) in obs.enumerated() {
    guard let cand = o.topCandidates(3).first else { continue }
    let lineRect = o.boundingBox

    lines.append([
      "text": cand.string,
      "box": rectToBox(rect: lineRect),
      "quad": rectToQuad(rect: lineRect),
      "lineIndex": lineIndex,
      "blockIndex": 0
    ])

    let ns = cand.string as NSString
    let whole = NSRange(location: 0, length: ns.length)

    priceRegex.enumerateMatches(in: cand.string, options: [], range: whole) { m, _, _ in
      guard let m = m, m.range.length > 0,
            let r = Range(m.range, in: cand.string),
            let priceObs = try? cand.boundingBox(for: r) else { return }

      let priceRect = priceObs.boundingBox
      let priceText = ns.substring(with: m.range).trimmingCharacters(in: .whitespaces)

      // label on the same line, left of price
      let beforeNS = NSRange(location: 0, length: m.range.location)
      var labelText = ""
      var labelRect: CGRect?
      if beforeNS.length > 0,
         let r2 = Range(beforeNS, in: cand.string),
         let beforeObs = try? cand.boundingBox(for: r2) {
        labelRect = beforeObs.boundingBox
        let rawLeft = ns.substring(with: beforeNS)
        labelText = rawLeft.replacingOccurrences(of: #"[ \t.\-·:•…]+$"#, with: "", options: .regularExpression)
      }

      var payload: [String: Any] = [
        "text": priceText,
        "confidence": cand.confidence,
        "box": rectToBox(rect: priceRect),
        "quad": rectToQuad(rect: priceRect),
        "lineIndex": lineIndex,
        "lineText": cand.string,
        "lineBox": rectToBox(rect: lineRect)
      ]
      if let l = labelRect, !labelText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        payload["labelText"] = labelText
        payload["labelBox"]  = rectToBox(rect: l)
      }
      prices.append(payload)
    }
  }

  // simple left-pairing fallback (optional, copy from your main fn if needed)

  return ["width": width, "height": height, "rotation": 0, "words": [], "lines": lines, "prices": prices]
}
  private func rectToQuad(rect: CGRect) -> [String: Any] {
    let x = rect.origin.x
    let w = rect.size.width
    let yTop = 1.0 - rect.origin.y
    let yBottom = yTop - rect.size.height
    return [
      "topLeft":     ["x": x,     "y": yBottom],
      "topRight":    ["x": x+w,   "y": yBottom],
      "bottomRight": ["x": x+w,   "y": yTop],
      "bottomLeft":  ["x": x,     "y": yTop],
    ]
  }

private func preprocessedCGImage(from ui: UIImage) -> CGImage? {
  guard var ci = CIImage(image: ui) else { return ui.cgImage }
  // Auto-invert if overall dark
  let avg = ci.applyingFilter("CIAreaAverage", parameters: [kCIInputExtentKey: CIVector(cgRect: ci.extent)])
  var pixel = [UInt8](repeating: 0, count: 4)
  CIContext().render(avg, toBitmap: &pixel, rowBytes: 4, bounds: CGRect(x:0, y:0, width:1, height:1), format: .RGBA8, colorSpace: nil)
  let luminance = 0.2126*Double(pixel[0]) + 0.7152*Double(pixel[1]) + 0.0722*Double(pixel[2])
  if luminance < 90 { ci = ci.applyingFilter("CIColorInvert") }

  let boosted = ci
    .applyingFilter("CIColorControls", parameters: ["inputContrast": 1.2, "inputBrightness": 0, "inputSaturation": 1.0])
    .applyingFilter("CISharpenLuminance", parameters: ["inputSharpness": 0.45])

  return CIContext().createCGImage(boosted, from: boosted.extent)
}
}

// Orientation bridge
extension CGImagePropertyOrientation {
  init(_ ui: UIImage.Orientation) {
    switch ui {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
