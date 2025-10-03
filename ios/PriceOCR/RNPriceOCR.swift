//
//  RNPriceOCR.swift
//  CurrencyCamera
//
//  Drop-in native OCR price detector with richer output.
//  - Two-pass OCR (fast → tiny) with prioritized languages
//  - Vision OCR + robust numeric normalization (UTF-16 index map)
//  - Currency detection (symbols, ISO, aliases) + customWords
//  - Regex + context filters (units/dates/phones/tuples)
//  - Parentheses rule: allow "(12,50)" but block "(1,2,8)"
//  - Column/leader/dash aware bare-price heuristics
//  - Inline-label + post-pair orphan labels (retry with relaxed thresholds)
//  - Outputs top-left normalized boxes + quads
//

import Foundation
import Vision
import UIKit
import ImageIO
import React
import os

private let DEBUG_OCR = true
private let LOG = Logger(subsystem: "RNPriceOCR", category: "PriceOCR")

@inline(__always) private func dbg(_ msg: String) {
  guard DEBUG_OCR else { return }
  LOG.debug("\(msg, privacy: .public)")
}

@inline(__always) private func fmt(_ r: NSRange) -> String { "[\(r.location),\(r.length)]" }
@inline(__always) private func fmt(_ g: CGRect) -> String {
  String(format: "{x:%.3f y:%.3f w:%.3f h:%.3f}", g.origin.x, g.origin.y, g.size.width, g.size.height)
}
@inline(__always) private func short(_ s: String, _ n: Int = 60) -> String {
  if s.count <= n { return s }
  let i = s.index(s.startIndex, offsetBy: n)
  return s[s.startIndex..<i] + "…"
}

@objc(RNPriceOCR)
class RNPriceOCR: NSObject {

  // MARK: - React Bridge

  /// Simple connectivity test from JS: resolves "pong".
  @objc(ping:rejecter:)
  func ping(_ resolve: RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve("pong")
  }

  /// Main entry: detects prices in an image at `uri`.
  /// - Loads & preprocesses the CGImage
  /// - Runs OCR in two passes (fast height, then tiny glyphs if needed)
  /// - Extracts price candidates + attaches labels
  /// - Resolves a JSON dictionary with lines[] and prices[]
  @objc(detectTextInImage:resolver:rejecter:)
  func detectTextInImage(_ uri: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {

    // 1) Load image + basic preprocess
    guard let (cgImage, orientation) = loadCGImage(uri, lightPreproc: false) else {
      reject("E_IMAGE", "Cannot load image at \(uri)", nil); return
    }

    // Local containers we reuse across passes
    var lines: [[String: Any]] = []
    var prices: [[String: Any]] = []

    // Extraction closure shared by both passes
    func processObservations(_ obs: [VNRecognizedTextObservation]) {
      lines.removeAll(keepingCapacity: true)
      prices.removeAll(keepingCapacity: true)

      for (lineIndex, o) in obs.enumerated() {
        guard let cand = o.topCandidates(3).first else { continue }

        // Better rotated quad for the full line if available
        var lineQuad: [String: Any] = self.axisRectToQuadDict(o.boundingBox)
        if let fullObs = try? cand.boundingBox(for: cand.string.startIndex..<cand.string.endIndex) {
          lineQuad = self.rectObsToQuadDict(fullObs)
        }

        // Save whole line (debug/fallback)
        let lineRect = o.boundingBox
        lines.append([
          "text": cand.string,
          "box": self.rectToBox(rect: lineRect),
          "quad": lineQuad,
          "lineIndex": lineIndex,
          "blockIndex": 0
        ])

        // Normalize for numeric matching (build UTF-16 index map)
        let (normalized, idxMap) = normalizeForPriceMatchingUTF16(cand.string)
        dbg("  norm: “\(short(normalized))”, idxMap.count=\(idxMap.count)")
        let ns = normalized as NSString
        let whole = NSRange(location: 0, length: ns.length)

        var lineCandidates: [[String: Any]] = []

 PRICE_LAX_REGEX.enumerateMatches(in: normalized, options: [], range: whole) { m, _, _ in
  guard let m = m, m.range.length > 0 else { return }

  // Extract matched text (normalized space) and map back to original UTF-16 range
  let priceText = ns.substring(with: m.range).trimmingCharacters(in: .whitespaces)

  let normStart = m.range.location
  let normEnd   = m.range.location + m.range.length - 1
  guard normStart < idxMap.count, normEnd < idxMap.count else {
    dbg("      ✗ drop: idxMap out of bounds"); return
  }
  let origStartU16 = idxMap[normStart]
  let origEndU16   = idxMap[normEnd]
  let origRange    = NSRange(location: origStartU16, length: max(1, origEndU16 - origStartU16 + 1))
  dbg("      origRange=\(fmt(origRange))")

  // Subrange bbox (fallback → whole line bbox)
  var priceObsOpt: VNRectangleObservation? = nil
  if let swiftRange = Range(origRange, in: cand.string) {
    priceObsOpt = try? cand.boundingBox(for: swiftRange)
  }
  let priceRect = priceObsOpt?.boundingBox ?? o.boundingBox
  let boxDict   = self.rectToBox(rect: priceRect)
  let quadDict  = priceObsOpt.map(self.rectObsToQuadDict) ?? self.rectToQuad(rect: priceRect)
  dbg(" ✓ CAND “\(priceText)” priceRect=\(fmt(priceRect))")

  // Context windows around the match (in normalized space)
  let (beforeCtx, afterCtx) = contextAround(ns, m.range, left: 12, right: 12)
  if isQuantitySegment(leftContext: beforeCtx, rightContext: afterCtx) {
    dbg("      ✗ drop: quantity segment (price / qty)");
    return
  }
  // Currency detection: inside match, near original range, in contexts, or anywhere on the line
  func firstCurrency(_ s: String) -> String? {
    guard let hit = CURRENCY_NEARBY_REGEX.firstMatch(
      in: s, options: [], range: NSRange(location: 0, length: (s as NSString).length)
    ) else { return nil }
    return (s as NSString).substring(with: hit.range)
  }
let rawCPrimary = firstCurrency(priceText)
let rawCWindow  = currencyNear(in: cand.string, around: origRange, window: 10)
//let rawCLine    = currencyAnywhere(in: cand.string)      // whole line
//let rawC        = rawCPrimary ?? rawCWindow ?? rawCLine
let rawC        = rawCPrimary ?? rawCWindow
let normC       = rawC.map(normalizeCurrency)

  // If there is NO currency, run the stricter bare-number guards
  let hasCurrency = (normC != nil)

// (optional but useful for debugging)
dbg("      currency: \(hasCurrency ? (normC!) : "none") in “\(priceText)”")

// Bare-number plausibility only when we truly have no currency anywhere
if !hasCurrency {
  if isWholeMatch(NONPRICE_WHOLE_REGEX, in: priceText) { dbg("      ✗ drop: NONPRICE_WHOLE"); return }
  let ignoreOnOrig = ignoredRanges(in: cand.string)
  if intersectsAny(origRange, ignoreOnOrig) { dbg("      ✗ drop: intersects ignored span"); return }

  // NOTE: remove 'rightHalf' from the keep condition (see function below)
  if !looksLikeBarePrice(priceText: priceText,
                         fullLineText: cand.string,
                         ns: ns,
                         match: m,
                         lineRect: o.boundingBox,
                         priceRect: priceRect,
                         leftContext: beforeCtx,
                         rightContext: afterCtx) { return }
}


  // Build optional inline label to the LEFT (same line segment)
  let leftPartOrig = NSRange(location: 0, length: origRange.location)
  var labelText = ""
  var labelBox: [String: Any]?; var labelQuad: [String: Any]?
  if leftPartOrig.length > 0,
     let r2 = Range(leftPartOrig, in: cand.string),
     let beforeObs = try? cand.boundingBox(for: r2) {
    labelText = (cand.string as NSString)
      .substring(with: leftPartOrig)
      .replacingOccurrences(of: #"[ \t.\-·:•…]+$"#, with: "", options: .regularExpression)
    labelBox  = self.rectToBox(rect: beforeObs.boundingBox)
    labelQuad = self.rectObsToQuadDict(beforeObs)
  }

  // Assemble payload
var payload: [String: Any] = [
  "text": priceText,
  "confidence": cand.confidence,
  "box": boxDict,
  "quad": quadDict,
  "lineIndex": lineIndex,
  "lineText": cand.string,
  "lineBox": self.rectToBox(rect: o.boundingBox),
  "lineQuad": self.axisRectToQuadDict(o.boundingBox)
]
payload["leftCtx"]  = beforeCtx
payload["rightCtx"] = afterCtx

if !labelText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
  payload["labelText"] = labelText
  payload["labelBox"]  = labelBox
  payload["labelQuad"] = labelQuad
}
if let c = normC { payload["currencyCode"] = c; payload["rawCurrency"] = rawC! }

lineCandidates.append(payload)
}// enumerate matches

        // Keep ALL matches on the line (menus often have multiple sizes per row/column)
        prices.append(contentsOf: lineCandidates)

// --- Safety net: attach currency if it appears anywhere on the candidate or its line ---
for i in 0..<prices.count {
  if prices[i]["currencyCode"] == nil {
    let t = (prices[i]["text"] as? String) ?? ""
    let line = (prices[i]["lineText"] as? String) ?? ""
if let raw = currencyAnywhere(in: t) {
  prices[i]["rawCurrency"] = raw
      prices[i]["currencyCode"] = normalizeCurrency(raw)
      dbg("  currency-safety: attached \(prices[i]["currencyCode"]!) to “\(t)”")
    }
  }
}
      }
      let pageHasCurrency = prices.contains { $0["currencyCode"] != nil }

       // for each line
if STRICT_CURRENCY_GATE {
  if pageHasCurrency {
    // current behavior when we clearly see currency anywhere
    gateBareNumbersWhenCurrencyPresent(lines: lines, prices: &prices)
  } else {
    // new: align/prune bare numbers into a plausible price column
    keepBareNumbersWhenNoCurrencyPresent(lines: lines, prices: &prices)
  }
}
      // Post-pair orphan labels (pass 1: strict thresholds)
      postPairOrphanLabels(lines: &lines, prices: &prices,
                           overlapMin: 0.45, aboveWindowScale: 1.6)

      // If many orphans remain, relax thresholds and retry
      let orphanCount = prices.filter { (($0["labelText"] as? String)?.isEmpty ?? true) }.count
      if orphanCount > 0 {
        postPairOrphanLabels(lines: &lines, prices: &prices,
                             overlapMin: 0.30, aboveWindowScale: 2.0)
      }
    }

    // 2) Build & run OCR requests (two-pass: fast → tiny)
    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])

    // PASS 1: faster (ignore ultra tiny text)
    do {
      let req1 = makeRequest(
        minTextHeight: 0.0045, // default a bit stricter to reduce noise
        recognitionLanguages: preferredVisionLanguages(),
        useCustomWords: true
      ) { [weak self] r, e in
        guard let self = self else { return }
        if let e = e {
          dbg("❌ Vision pass1 error: \(e.localizedDescription)")
          return
        }
        if let obs = r.results as? [VNRecognizedTextObservation] {
          processObservations(obs)
        }
      }
      try handler.perform([req1])
    } catch {
      reject("E_OCR", "Perform failed (pass1): \(error.localizedDescription)", error)
      return
    }

    // If pass1 already found prices, return now
    if !prices.isEmpty {
      resolve([
        "width": cgImage.width,
        "height": cgImage.height,
        "rotation": 0,
        "words": [] as [[String: Any]],
        "lines": lines,
        "prices": prices
      ])
      return
    }

    // PASS 2: tiny glyphs enabled (more recall)
    do {
      lines.removeAll(keepingCapacity: true)
      prices.removeAll(keepingCapacity: true)

      let req2 = makeRequest(
        minTextHeight: 0.0028, // allow tiny digits/symbols
        recognitionLanguages: preferredVisionLanguages(),
        useCustomWords: true
      ) { [weak self] r, e in
        guard let self = self else { return }
        if let e = e {
          dbg("❌ Vision pass2 error: \(e.localizedDescription)")
          return
        }
        if let obs = r.results as? [VNRecognizedTextObservation] {
          processObservations(obs)
        }
      }
      try handler.perform([req2])

      resolve([
        "width": cgImage.width,
        "height": cgImage.height,
        "rotation": 0,
        "words": [] as [[String: Any]],
        "lines": lines,
        "prices": prices
      ])
    } catch {
      // Even if pass2 fails, return pass1 results (possibly empty but structured)
      resolve([
        "width": cgImage.width,
        "height": cgImage.height,
        "rotation": 0,
        "words": [] as [[String: Any]],
        "lines": lines,
        "prices": prices
      ])
    }
  }

  // MARK: - OCR Request Builder
private let STRICT_CURRENCY_GATE = true

/// Drop noisy bare numbers when we clearly see a currency price column.
/// Keeps bare numbers only if (two decimals) OR (leader/dash on the line)
/// OR (aligned with the currency column). Also drops tiny integers (≤9).
private func gateBareNumbersWhenCurrencyPresent(lines: [[String: Any]],
                                                prices: inout [[String: Any]]) {

  func toVisionCGRect(_ box: [String: Any]) -> CGRect {
    let x = box["x"] as! CGFloat
    let yTopLeft = box["y"] as! CGFloat
    let w = box["width"] as! CGFloat
    let h = box["height"] as! CGFloat
    let yVision = 1.0 - yTopLeft - h
    return CGRect(x: x, y: yVision, width: w, height: h)
  }
  func vertOverlap(_ a: CGRect, _ b: CGRect) -> CGFloat {
    let y1 = max(a.minY, b.minY), y2 = min(a.maxY, b.maxY)
    return max(0, y2 - y1) / max(1e-6, min(a.height, b.height))
  }

  // Currency hits → estimate the "rightmost column"
  let currencyRects: [CGRect] = prices.compactMap { p in
    guard p["currencyCode"] != nil, let box = p["box"] as? [String: Any] else { return nil }
    return toVisionCGRect(box)
  }
  guard currencyRects.count >= 2 else { return }   // no evidence → don’t gate

  let hits = currencyRects.map { $0.midX }.sorted()
  // use the 2/3 quantile = "rightmost majority"
  let idx = min(hits.count - 1, max(0, Int(ceil(0.66 * CGFloat(hits.count - 1)))))
  let rightMostColumnX = hits[idx]
  // small tolerance around that column
  let band: CGFloat = 0.03

  // Also build a quick vertical map of currency prices to kill grams on same row
  // (if a currency price sits to the right on the same row, the bare left number is NOT a price)
  let currencyByRow = currencyRects

  prices = prices.filter { p in
    if p["currencyCode"] != nil { return true } // keep explicit-currency hits

    guard
      let text = p["text"] as? String,
      let lineText = p["lineText"] as? String,
      let box = p["box"] as? [String: Any]
    else { return false }

    let pr = toVisionCGRect(box)
    let mx = pr.midX

    // obvious keeps for bare numbers
    let hasDec2 = text.range(of: #"[.,]\d{2}\b"#, options: .regularExpression) != nil
    let leaderOnLine = lineText.range(of: #"\.{2,}|[–-]"#, options: .regularExpression) != nil

    // NEW: kill if a currency price shares the row and sits to the right
    let hasCurrencyToRightOnSameRow = currencyByRow.contains {
      vertOverlap(pr, $0) >= 0.45 && $0.minX > pr.midX + 0.01
    }
    if hasCurrencyToRightOnSameRow && !hasDec2 && !leaderOnLine {
      dbg("      ✗ gate(drop: currency to right on same row): \(text)")
      return false
    }

    // Drop tiny integers (≤9) unless decimal
    let numeric = text
      .replacingOccurrences(of: #"[^\d.,-]"#, with: "", options: .regularExpression)
      .replacingOccurrences(of: ",", with: ".")
      .replacingOccurrences(of: "–", with: "")
      .replacingOccurrences(of: "-", with: "")
    if let v = Double(numeric), v <= 9, !hasDec2 { return false }

    // ALIGNMENT: if we have a currency column, bare integers must live in it
    // i.e., be close to the rightmost column or have leader/decimals.
    let alignedWithRightColumn = abs(mx - rightMostColumnX) <= band || mx >= (rightMostColumnX - 0.02)

    let keep = hasDec2 || leaderOnLine || alignedWithRightColumn
    if !keep { dbg("      ✗ gate(drop bare/alignment): \(text) @ \(String(format: "%.3f", mx)) not near right col \(String(format: "%.3f", rightMostColumnX))") }
    return keep
  }
}
/// When no currency tokens are present anywhere on the page,
/// keep bare numbers that form a right-side price column.
/// Decimals and dotted leaders always keep; misaligned strays drop.
private func keepBareNumbersWhenNoCurrencyPresent(lines: [[String: Any]],
                                                  prices: inout [[String: Any]]) {

  func toVisionCGRect(_ box: [String: Any]) -> CGRect {
    let x = box["x"] as! CGFloat, yTL = box["y"] as! CGFloat
    let w = box["width"] as! CGFloat, h = box["height"] as! CGFloat
    return CGRect(x: x, y: 1.0 - yTL - h, width: w, height: h)
  }

  // Consider only bare-number candidates
  var bare: [(idx:Int, rect:CGRect, mx:CGFloat, left:String, right:String, line:String, text:String)] = []
  for (i,p) in prices.enumerated() {
    guard p["currencyCode"] == nil,
          let box = p["box"] as? [String:Any],
          let line = p["lineText"] as? String,
          let text = p["text"] as? String
    else { continue }
    let left  = (p["leftCtx"] as? String)  ?? ""
    let right = (p["rightCtx"] as? String) ?? ""
    bare.append((i, toVisionCGRect(box), toVisionCGRect(box).midX, left, right, line, text))
  }
  guard bare.count >= 3 else { return }

  // Dominant right column
  let xs = bare.map{$0.mx}.sorted()
  let idx = min(xs.count - 1, max(0, Int(ceil(0.66 * CGFloat(xs.count - 1)))))
  let rightColX = xs[idx]
  let band: CGFloat = 0.04

  // Pre-scan: how many are unit/percent/ABV neighbors?
let unitishCount = bare.reduce(0) { acc, b in
  let hasUnit = unitTokenRightAfter(b.right) || unitTokenLeftBefore(b.left)
  let hasPct  = percentImmediatelyAfter(rightContext: b.right)
  let hasABV  =
    b.left.range(of: #"(?i)\b(alc|alco?ol|abv|vol)\b\s*$"#, options: .regularExpression) != nil ||
    b.right.range(of: #"(?i)^\s*\b(alc|alco?ol|abv|vol)\b"#, options: .regularExpression) != nil
  return acc + ((hasUnit || hasPct || hasABV) ? 1 : 0)
}

  // If the "column" is mostly sizes/ABV, treat the page as price-less → drop them all.
  if CGFloat(unitishCount) / CGFloat(bare.count) >= 0.45 {
    prices.removeAll { $0["currencyCode"] == nil }
    dbg("      gate(nocurrency): page looks like sizes/ABV → drop all bare numbers")
    return
  }

  // Otherwise: keep only things aligned with the price column and NOT unit/percent/ABV
let keepSet = Set(bare.compactMap { b -> Int? in
let hasInline: (Int) -> Bool = { i in
  ((prices[i]["labelText"] as? String)?
    .trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false)
}

let denom = max(1, bare.filter { !hasInline($0.idx) }.count)
let ratio = CGFloat(unitishCount) / CGFloat(denom)
if ratio >= 0.65 {

  let aligned = abs(b.mx - rightColX) <= band || b.mx >= (rightColX - 0.02)
  let hasDec  = b.text.range(of: #"[.,]\d{1,2}\b"#, options: .regularExpression) != nil
  let leader  = b.line.range(of: #"\.{2,}|[–-]"#, options: .regularExpression) != nil

  let unitish =
    unitTokenRightAfter(b.right) ||
    unitTokenLeftBefore(b.left)  ||
    percentImmediatelyAfter(rightContext: b.right) ||
    b.left.range(of: #"(?i)\b(alc|alco?ol|abv|vol)\b\s*$"#, options: .regularExpression) != nil ||
    b.right.range(of: #"(?i)^\s*\b(alc|alco?ol|abv|vol)\b"#, options: .regularExpression) != nil

  return ((aligned || hasDec || leader || hasInlineLabel) && !unitish) ? b.idx : nil
  }
})


  prices = prices.enumerated().compactMap { (i,p) in
    if p["currencyCode"] != nil { return p }
    return keepSet.contains(i) ? p : nil
  }
}


  /// Creates a configured VNRecognizeTextRequest with the given parameters.
  private func makeRequest(minTextHeight: Float,
                          recognitionLanguages: [String],
                          useCustomWords: Bool,
                          completion: @escaping VNRequestCompletionHandler) -> VNRecognizeTextRequest {
    let req = VNRecognizeTextRequest(completionHandler: completion)
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = true
    if #available(iOS 16.0, *) { req.revision = VNRecognizeTextRequestRevision3 }
    req.recognitionLanguages = recognitionLanguages
    req.minimumTextHeight = minTextHeight
    if useCustomWords, #available(iOS 15.0, *) { req.customWords = buildCustomCurrencyWords() }
    return req
  }
/// Finds the first currency token anywhere in the given line.
private func currencyAnywhere(in s: String) -> String? {
  guard !s.isEmpty else { return nil }
  let ns = s as NSString
  if let m = CURRENCY_NEARBY_REGEX.firstMatch(in: s, options: [], range: NSRange(location: 0, length: ns.length)) {
    return ns.substring(with: m.range)
  }
  return nil
}

/// Currency within a small window around the match in the original line.
private func currencyNear(in full: String, around r: NSRange, window: Int = 16) -> String? {
  let ns = full as NSString
  let start = max(0, r.location - window)
  let end   = min(ns.length, r.location + r.length + window)
  let local = ns.substring(with: NSRange(location: start, length: end - start))
  if let m = CURRENCY_NEARBY_REGEX.firstMatch(in: local, options: [], range: NSRange(location: 0, length: (local as NSString).length)) {
    return (local as NSString).substring(with: m.range)
  }
  return nil
}
private func isIngredientLike(_ s: String) -> Bool {
  let trimmed = s.trimmingCharacters(in: .whitespaces)
  if trimmed.first.map({ ",.;:•·-".contains($0) }) == true { return true }
  let letters = s.unicodeScalars.filter { CharacterSet.letters.contains($0) }
  let uppers  = letters.filter { CharacterSet.uppercaseLetters.contains($0) }
  let lowerRatioHigh = !letters.isEmpty && (Double(uppers.count) / Double(letters.count) < 0.25)
  let commaCount = s.filter { $0 == "," }.count
  return lowerRatioHigh || commaCount >= 2
}
private func titleScore(_ s: String) -> CGFloat {
  let letters = s.unicodeScalars.filter { CharacterSet.letters.contains($0) }
  let uppers  = letters.filter { CharacterSet.uppercaseLetters.contains($0) }
  let upperRatio = letters.isEmpty ? 0.0 : (Double(uppers.count) / Double(letters.count))
  let longWords = s.split{ !$0.isLetter }.map(String.init).filter { $0.count >= 2 }.count
  let commaPenalty = 0.1 * CGFloat(s.filter { $0 == "," }.count)
  return CGFloat(upperRatio) * 1.2 + CGFloat(longWords) * 0.02 - commaPenalty
}
private func hasLeaderOrDashAdjacent(rightContext: String) -> Bool {
  // Skip a tiny amount of whitespace, then require '-'/'–' or a run of '.' characters
  return rightContext.range(of: #"^\s{0,2}([\-–]|\.{2,})"#, options: .regularExpression) != nil
}
private func percentImmediatelyAfter(rightContext: String) -> Bool {
  // First non-space may be punctuation, then %/‰/％.
  // Also accept common OCR slips like o/0 or °/0.
  if rightContext.range(of: #"^\s{0,3}[%‰％]"#, options: .regularExpression) != nil { return true }
  if rightContext.range(of: #"^\s{0,3}[\p{Punct}«»“”'")]{0,2}\s*[%‰％]"#, options: .regularExpression) != nil { return true }
  if rightContext.range(of: #"^\s{0,3}(?:[oO0°][/ ]?0)"#, options: .regularExpression) != nil { return true }
  return false
}

// Catch ml/l and common slips (m1, mI, m!, mL), and short unit tails like "m"
private func unitTokenRightAfter(_ s: String) -> Bool {
  return s.range(of: #"^\s{0,3}(?:m(?:l|[1iI!L])?\.?|cl|dl|l\.?|gr?|kg|mg|oz|lb|lbs|cm|mm|km|kcal|cal|kj)\b"#,
                 options: [.regularExpression, .caseInsensitive]) != nil
}

private func unitTokenLeftBefore(_ s: String) -> Bool {
  return s.range(of: #"(?i)(?:alc|alco?ol|abv|vol|ml|ML|L|KL|m[1iI!L]?|cl|dl|l|gr?|kg|mg|oz|lb|lbs|cm|mm|km|kcal|cal|kj)\s{0,3}$"#,
                 options: .regularExpression) != nil
}

private func plusImmediatelyBefore(leftContext: String) -> Bool {
  // e.g. "...  EXTRA SHOT   +4"
  return leftContext.range(of: #"\+\s{0,2}$"#, options: .regularExpression) != nil
}

/// Returns true if a unit token (g, gr, kg, ml, l, cl, dl, cm, mm, km, kcal...) appears right after the match (≤ 3 chars)
private func unitImmediatelyAfter(rightContext: String) -> Bool {
  unitTokenRightAfter(rightContext)
}

  // MARK: - Post-pairing

  /// Attaches labels to prices that don't have an inline label.
  /// - Prefers same-row left candidates (with vertical overlap)
  /// - Falls back to the nearest line above within a vertical window
  /// - Skips lines that look like pure price columns or allergen tuples
 /// Attaches labels to prices that don't have an inline label.
/// Geometry first; add semantic penalties/bonuses to avoid ingredient labels.
private func postPairOrphanLabels(lines: inout [[String: Any]],
                                  prices: inout [[String: Any]],
                                  overlapMin: CGFloat,
                                  aboveWindowScale: CGFloat) {

  func toVisionCGRect(_ box: [String: Any]) -> CGRect {
    let x = box["x"] as! CGFloat
    let yTopLeft = box["y"] as! CGFloat
    let w = box["width"] as! CGFloat
    let h = box["height"] as! CGFloat
    let yVision = 1.0 - yTopLeft - h
    return CGRect(x: x, y: yVision, width: w, height: h)
  }

  func verticalOverlapRatio(_ a: CGRect, _ b: CGRect) -> CGFloat {
    let y1 = max(a.minY, b.minY)
    let y2 = min(a.maxY, b.maxY)
    return max(0, y2 - y1) / max(1e-6, min(a.height, b.height))
  }

  func isPriceLine(_ text: String) -> Bool {
    return PRICE_LAX_REGEX.firstMatch(in: text, options: [],
      range: NSRange(location:0, length: (text as NSString).length)) != nil
  }

  for i in 0..<prices.count {
    let hasLabel = (prices[i]["labelText"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
    if hasLabel { continue }

    guard let pBoxDict = prices[i]["box"] as? [String: Any] else { continue }
    let p = toVisionCGRect(pBoxDict)
    let lineH = p.height

    var bestIdx: Int?
    var bestScore = CGFloat.greatestFiniteMagnitude
    dbg("  pairing for price \(i): “\((prices[i]["text"] as? String) ?? "?")”")

    for (j, line) in lines.enumerated() {
      let text = (line["text"] as? String) ?? ""
      if text.isEmpty { continue }
      if isPriceLine(text) || isAllergenLine(text) { continue }
      guard let lBoxDict = line["box"] as? [String: Any] else { continue }
      let l = toVisionCGRect(lBoxDict)

      var score = CGFloat.greatestFiniteMagnitude

      // Same row, left
      if verticalOverlapRatio(p, l) >= overlapMin && l.maxX <= p.minX + 0.008 {
        let dy = abs(p.midY - l.midY)
        let xCenterDelta = abs(l.midX - p.midX)
        let leftBonus = max(0, p.minX - l.maxX)
        // semantic adjustments
        let ingPenalty = isIngredientLike(text) ? 1.0 : 0.0
        let titleBonus = min(titleScore(text), 1.0) // clamp
        score = dy * 3.0 + xCenterDelta * 1.2 - leftBonus * 0.6 - titleBonus * 1.2 + ingPenalty * 1.2

      } else {
        // Above window only (avoid pairing to lines below the price)
        let isAbove = l.maxY <= p.minY && (p.minY - l.maxY) <= max(aboveWindowScale * lineH, 0.025)
        if isAbove {
          let xCenterDelta = abs(l.midX - p.midX)
          let leftBonus = max(0, p.minX - l.maxX)
          let dy = p.minY - l.maxY
          let ingPenalty = isIngredientLike(text) ? 1.2 : 0.0
          let titleBonus = min(titleScore(text), 1.0)
          score = dy * 3.0 + xCenterDelta * 1.2 - leftBonus * 0.5 - titleBonus * 1.0 + ingPenalty * 1.5
        } else {
          continue
        }
      }

      if score < bestScore {
        bestScore = score
        bestIdx = j
      }
    }

    if let idx = bestIdx {
      prices[i]["labelText"] = lines[idx]["text"]
      prices[i]["labelBox"]  = lines[idx]["box"]
      dbg("  → chosen label: \((prices[i]["labelText"] as? String).map { "“\(short($0, 45))”" } ?? "—")")
    } else {
      dbg("  → chosen label: —")
    }
  }
}

  // MARK: - Helpers (IO / geometry)

  /// Loads a CGImage from file URI, applies preprocessing (invert/contrast/sharpen),
  /// upscales small images, and returns CGImage + orientation for Vision.
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
// Inside class RNPriceOCR
private func isQuantitySegment(leftContext: String, rightContext: String) -> Bool {
  // “/” or “per” immediately to the left of the number?
  let slashOrPerLeft =
    leftContext.range(of: #"[\/×x]\s{0,2}$"#, options: .regularExpression) != nil ||
    leftContext.range(of: #"(?i)\bper\s?$"#, options: .regularExpression) != nil
  guard slashOrPerLeft else { return false }

  // Case A: immediate unit → “… / 250 g”
  if unitImmediatelyAfter(rightContext: rightContext) { return true }

  // Case B: chained form → “… / 200 /150 g” (unit is in the NEXT segment)
  // Look for:  ^  /  digits  (optional: / digits)  unit
  let chainedUnit =
    rightContext.range(
      of: #"^\s*/\s*\d{1,4}(?:\s*/\s*\d{1,4})?\s*(g|gr|kg|mg|lb|lbs|oz|ml|l|cl|ML|CL|DL|CM|GR|G|dl|cm|mm|km|kcal|cal|kj|gr\.|kg\.|ml\.|l\.)\b"#,
      options: [.regularExpression, .caseInsensitive]
    ) != nil

  return chainedUnit
}

  /// Empty result payload with image size metadata.
  private func emptyResult(width: Int, height: Int) -> [String: Any] {
    ["width": width, "height": height, "rotation": 0, "words": [], "lines": [], "prices": []]
  }

  /// Converts a Vision rect (BL origin) to a top-left normalized box.
  private func rectToBox(rect: CGRect) -> [String: Any] {
    let x = rect.origin.x
    let y = 1.0 - rect.origin.y - rect.size.height
    return ["x": x, "y": y, "width": rect.size.width, "height": rect.size.height]
  }

  /// Axis-aligned rect to quad in top-left coordinates.
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

  /// Upscales small images using Lanczos + mild sharpen (helps tiny digits).
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

  /// Basic image preprocessing:
  /// - auto-invert if dark
  /// - contrast + sharpen
  private func preprocessedCGImage(from ui: UIImage) -> CGImage? {
    guard var ci = CIImage(image: ui) else { return ui.cgImage }
    // Auto-invert if overall dark (average luminance)
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

  /// Converts a Vision rectangle observation to a top-left normalized quad dict.
  private func rectObsToQuadDict(_ obs: VNRectangleObservation) -> [String: Any] {
    func visionPointToTopLeft(_ p: CGPoint) -> [String: CGFloat] {
      ["x": p.x, "y": 1.0 - p.y]
    }
    return [
      "topLeft":     visionPointToTopLeft(obs.topLeft),
      "topRight":    visionPointToTopLeft(obs.topRight),
      "bottomRight": visionPointToTopLeft(obs.bottomRight),
      "bottomLeft":  visionPointToTopLeft(obs.bottomLeft),
    ]
  }

  /// Fallback: axis-aligned rect → quad (still useful for line-level bbox).
  private func axisRectToQuadDict(_ rect: CGRect) -> [String: Any] {
    let x = rect.origin.x
    let yTop = 1.0 - rect.origin.y
    let w = rect.size.width
    let h = rect.size.height
    let yBottom = yTop - h
    return [
      "topLeft":     ["x": x,     "y": yTop - h],
      "topRight":    ["x": x+w,   "y": yTop - h],
      "bottomRight": ["x": x+w,   "y": yTop],
      "bottomLeft":  ["x": x,     "y": yTop],
    ]
  }

  // MARK: - Normalization & context

  /// Normalizes a string for numeric matching while preserving a UTF-16 index map.
  /// - Drops single spaces/bullets between digits
  /// - Collapses spaces around comma/period
  /// - Returns (normalized, outIndex→origUTF16Index map)
  private func normalizeForPriceMatchingUTF16(_ s: String) -> (norm: String, map: [Int]) {
    let u16 = Array(s.utf16)
    var out: [UInt16] = []
    var map: [Int] = []

    func isDigit(_ c: UInt16) -> Bool { c >= 48 && c <= 57 }
    func isSpace(_ c: UInt16) -> Bool { c == 0x0020 || c == 0x00A0 || c == 0x2007 || c == 0x2009 }

    var i = 0
    while i < u16.count {
      let u = u16[i]

      // drop single spaces between digits: "5 50" -> "550"
      if isSpace(u), i > 0, i+1 < u16.count, isDigit(u16[i-1]), isDigit(u16[i+1]) { i += 1; continue }

      // drop centered dot/bullet between digits
      if (u == 0x00B7 || u == 0x2022), i > 0, i+1 < u16.count, isDigit(u16[i-1]), isDigit(u16[i+1]) {
        i += 1; continue
      }

      // collapse spaces after comma/period
      if u == 44 || u == 46 { // ',' '.'
        out.append(u); map.append(i)
        var j = i + 1
        while j < u16.count && isSpace(u16[j]) { j += 1 }
        i = j; continue
      }

      out.append(u); map.append(i); i += 1
    }

    let norm = String(utf16CodeUnits: out, count: out.count)
    return (norm, map)
  }

  /// Small context window (left/right) around a match in an NSString.
  private func contextAround(_ ns: NSString, _ range: NSRange, left: Int = 8, right: Int = 8) -> (String, String) {
    let start = max(0, range.location - left)
    let leftLen = min(left, range.location)
    let rightStart = range.location + range.length
    let rightLen = max(0, min(right, ns.length - rightStart))
    let before = ns.substring(with: NSRange(location: start, length: leftLen))
    let after  = ns.substring(with: NSRange(location: rightStart, length: rightLen))
    return (before, after)
  }

  // MARK: - Filters / heuristics

  /// Bare-price plausibility with flexible rules:
  /// - Blocks obvious non-prices
  /// - Blocks units/time *unless* a leader/dash is present (menu pattern)
  /// - Allows (two decimals) OR (leader/dash) OR (right-half alignment)
  /// - Sane numeric range guard
private func looksLikeBarePrice(priceText: String,
                                        fullLineText: String,
                                        ns: NSString,
                                        match m: NSTextCheckingResult,
                                        lineRect: CGRect,
                                        priceRect: CGRect,
                                        leftContext: String,
                                        rightContext: String) -> Bool {

  // quick numeric parsing
  let digitsOnly = priceText.replacingOccurrences(of: #"[^\d.,-]"#, with: "", options: .regularExpression)
  let normalized = digitsOnly
    .replacingOccurrences(of: ",", with: ".")
    .replacingOccurrences(of: "–", with: "")
    .replacingOccurrences(of: "-", with: "")
  let value = Double(normalized) ?? -1
  let sane = value >= 0.1 && value <= 999_999

  // Single-digit integers are often footnotes/bullets
  if value > 0, value <= 9, priceText.range(of: #"[.,]\d{1,2}"#, options: .regularExpression) == nil {
    dbg("      ✗ drop: single-digit bare integer"); return false
  }

  // Adjacent unit right after number? (e.g., "450 GR")
let unitAfter = unitImmediatelyAfter(rightContext: rightContext)
let leaderAdjacent = hasLeaderOrDashAdjacent(rightContext: rightContext)
let plusBefore = plusImmediatelyBefore(leftContext: leftContext)
if percentImmediatelyAfter(rightContext: rightContext)
   || unitTokenLeftBefore(leftContext) && rightContext.range(of: #"\s*%","#, options: .regularExpression) != nil {
  dbg("      ✗ drop: percent/ABV near number"); return false
}
if looksLikeAllergenTrail(rightContext) {
  dbg("      ✗ drop: allergen/icon trail after number"); return false
}
if unitAfter && !leaderAdjacent {
  dbg("      ✗ drop: unit immediately after number without leader/dash"); return false
}

// Nearby unit/time words get blocked unless a leader/dash pardons them.
let nearUnits =
  IGNORE_NEARBY_REGEX.firstMatch(in: leftContext, options: [], range: NSRange(location:0, length:(leftContext as NSString).length)) != nil
  || IGNORE_NEARBY_REGEX.firstMatch(in: rightContext, options: [], range: NSRange(location:0, length:(rightContext as NSString).length)) != nil
if nearUnits && !leaderAdjacent {
  dbg("      ✗ drop: unit/time nearby without leader/dash"); return false
}

let hasDecimalAny = priceText.range(of: #"[.,]\d{1,2}\b"#, options: .regularExpression) != nil
let rightHalf     = priceRect.midX >= lineRect.midX
let hasPct  = percentImmediatelyAfter(rightContext: rightContext)
let abvNear =
  leftContext.range(of: #"(?i)\b(alc|alco?ol|abv|vol)\b\s*$"#, options: .regularExpression) != nil ||
  rightContext.range(of: #"(?i)^\s*\b(alc|alco?ol|abv|vol)\b"#, options: .regularExpression) != nil
if hasPct || abvNear {
  dbg("      ✗ drop: percent/ABV near number"); return false
}
// Drop single digits unless it's an add-on like "+4"
if value > 0, value <= 9, !hasDecimalAny, !plusBefore {
  dbg("      ✗ drop: single-digit bare integer"); return false
}

// Keep if sane and (decimal OR dotted leader/dash OR right-half column OR "+")
let keep = sane && (hasDecimalAny || leaderAdjacent || rightHalf || plusBefore)
dbg("      bare-check: value=\(value) decAny=\(hasDecimalAny) leaderAdjacent=\(leaderAdjacent) rightHalf=\(rightHalf) plusBefore=\(plusBefore) -> \(keep ? "KEEP" : "DROP")")
return keep

}

  // MARK: - Language / currency dictionaries

  /// Broad, prioritized allowlist for Vision languages.
  private let VISION_LANG_ALLOWLIST: [String] = [
    "en_US","af","sq","ar","hy","az","be","bn","bs","bg","ca","hr","cs","da","nl",
    "et","fi","fr_FR","ka","de_DE","el","hu","is","id","it","kk","ky","lv","lt",
    "mk","ms","mt","mn","mr","ne","fa","pl","pt_PT","pt_BR","pa","ro_RO","ru",
    "sr","si","sk","sl","es_ES","sw","sv_SE","tr","uk","ur","uz","vi",
    "hi","gu","kn","ml","ta","te","th","lo",
    "ja","ko","zh-Hans","zh-Hant"
  ]

  /// Normalizes BCP-47 tags to Vision-friendly variants.
  private func normalizeBCP47ForVision(_ tag: String) -> String {
    var t = tag.replacingOccurrences(of: "_", with: "-")
    if t.hasPrefix("iw") { t = "he" }
    if t.hasPrefix("he") { return "he" }
    if t.hasPrefix("pt-BR") { return "pt_BR" }
    if t.hasPrefix("pt-PT") { return "pt_PT" }
    if t.hasPrefix("en") { return "en_US" }
    if t.hasPrefix("fr") { return "fr_FR" }
    if t.hasPrefix("de") { return "de_DE" }
    if t.hasPrefix("es") { return "es_ES" }
    if t.hasPrefix("sv") { return "sv_SE" }
    if t.hasPrefix("zh") {
      if t.contains("Hans") || t.contains("CN") { return "zh-Hans" }
      if t.contains("Hant") || t.contains("TW") || t.contains("HK") || t.contains("MO") { return "zh-Hant" }
      return "zh-Hans"
    }
    return t
  }

  /// Prioritized language list: user preferred first, then allowlist, capped to ~10.
  private func preferredVisionLanguages(maxCount: Int = 10) -> [String] {
    var langs = Locale.preferredLanguages.map(normalizeBCP47ForVision)
    for l in VISION_LANG_ALLOWLIST {
      let norm = normalizeBCP47ForVision(l)
      if !langs.contains(norm) { langs.append(norm) }
    }
    var seen = Set<String>()
    let dedup = langs.filter { seen.insert($0).inserted }
    return Array(dedup.prefix(maxCount))
  }

  /// Build customWords for Vision (iOS 15+): ISO codes + aliases + symbols.
  @available(iOS 15.0, *)
  private func buildCustomCurrencyWords() -> [String] {
    var w = Set<String>()
    ISO_CODES.forEach { w.insert($0) }
    for k in CURRENCY_ALIASES.keys {
      caseVariants(k).forEach { w.insert($0) }
    }
    for v in CURRENCY_ALIASES.values { w.insert(v) }
    CURRENCY_SYMBOLS.forEach { w.insert($0) }
    ["LEI","Lei","lei","LEl","LE1","leu","Leu"].forEach { w.insert($0) }
    return Array(w.prefix(300))
  }

  private let ISO_CODES: [String] = [
    "RON","EUR","USD","GBP","CHF","PLN","CZK","HUF","BGN","RSD","UAH","RUB","TRY",
    "SEK","NOK","DKK","ISK","ILS","AED","SAR","JPY","CNY","INR","KRW","CAD","AUD",
    "NZD","MXN","BRL"
  ]

  private let CURRENCY_SYMBOLS: [String] = [
    "€","$","£","₺","₽","₪","₩","₴","¥","₹","₫",
    "Kč","Ft","zł","лв","дин","руб","د.إ","ر.س","円","元","人民币","R$","C$","A$","NZ$","Mex$","M$X"
  ]

  private func caseVariants(_ s: String) -> [String] {
    guard !s.isEmpty else { return [] }
    if s.count == 1 { return [s.lowercased(), s.uppercased()] }
    return [s, s.lowercased(), s.uppercased(), s.capitalized]
  }

} // class

// MARK: - Orientation bridge

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

// MARK: - Tiny regex sugar

private extension String {
  var r: NSRegularExpression { try! NSRegularExpression(pattern: self, options: []) }
  var ri: NSRegularExpression { try! NSRegularExpression(pattern: self, options: [.caseInsensitive]) }
}

// MARK: - Regexes & currency maps

/// Currency tokens accepted near a number (symbols, ISO codes, tolerant LEI).
private let CURRENCY_NEARBY_REGEX = makeRegex(
#"""
(€|\$|£|₺|₽|₪|₩|₴|¥|₹|₫
 | \b(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF|BGN|RSD|UAH|RUB|TRY|SEK|NOK|DKK|ISK|ILS|AED|SAR|JPY|CNY|INR|KRW|CAD|AUD|NZD|MXN|BRL|KČ|FT)\b
 | Kč
 | Ft
 | \bLE[Iil1T]\b          # LEI + common OCR slips
)
"""#,
options: [.caseInsensitive, .allowCommentsAndWhitespace]
)


/// Helper to compile regex safely; returns a "never matches" fallback if it fails.
private func makeRegex(_ pattern: String,
                       options: NSRegularExpression.Options = []) -> NSRegularExpression {
  do { return try NSRegularExpression(pattern: pattern, options: options) }
  catch {
    NSLog("❌ Regex compile error: \(error)\nPattern:\n\(pattern)")
    return try! NSRegularExpression(pattern: "(?!)")
  }
}


/// Obvious non-price whole patterns: times, dates, years, percentages, ratios, phones.
private let NONPRICE_WHOLE_REGEX = makeRegex(
  """
  ( \\b\\d{1,2}:\\d{2}\\b(?:\\s?(?:AM|PM))? )
  | ( \\b\\d{1,2}\\.\\d{2}\\s?(?:AM|PM)\\b )
  | ( \\b\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?\\b )
  | ( \\b\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}\\b )
  | ( \\b(?:19|20)\\d{2}\\b )
  | ( \\b\\d+(?:[.,]\\d+)?\\s*% )
  | ( \\b\\d+(?:\\s*-\\s*|/)\\d+\\b )
  | ( (?<!\\d)(?:\\+?\\d[\\s().-]?){7,}(?!\\d) )
  """,
  options: [.allowCommentsAndWhitespace, .caseInsensitive]
)

/// Spans on a line to ignore (times, AM/PM, dates, tuples like "(1,2,8)").
private let IGNORE_SPANS_REGEX = try! NSRegularExpression(pattern:
#"""
(?xi)
\b\d{1,2}:\d{2}(?:\s?(?:AM|PM))?
| \b\d{1,2}\.\d{2}\s?(?:AM|PM)\b
| \b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?
| \b\d{1,2}\.\d{1,2}\.\d{2,4}\b
| \(\s*\d{1,2}(?:\s*,\s*\d{1,2})+\s*\)
"""#, options: [])

/// Unit/measure/time words close to a number (blocks bare prices unless leader/dash present).
private let IGNORE_NEARBY_REGEX =
#"""
(?ix)
(?:^|[^\p{L}])
(
  g|gr|kg|mg|lb|lbs|oz|GR|G|KG|MG|LB|LBS|OZ|CUPS|cups
  | ml|l|cl|dl|ML|L|CL|DL|
  | cm|mm|km
  | °c|°f
  | kcal|cal|kj
  | pcs?|piece|slice|slices|servings?
  | pers?|persone|persons|people
  | month|months|mo
  | days|dia|d
  | year|years|yrs?
  | tbl|cif
  | carb|carbohydrate|protein|fat|sugar
  | h|hr|hrs|hour|hours|min|mins|minute|minutes|sec|secs|second|seconds
)
(?=$|[^\p{L}])
"""#.ri
private let ALLERGEN_TRAIL_REGEX =
#"""
(?xi) ^\s{0,3}
([©@®°ºoO●○•]|0)
(?:[\s·•●○oO0]{0,2}([©@®°ºoO●○•]|0)){1,5}\s*$
"""#.ri
/// Broad price pattern: optional currency (pre/post), digits with thousands/decimals.
// BEFORE: ... )? \s* -? \d{1,5} ...
// AFTER:
private let PRICE_LAX_REGEX = try! NSRegularExpression(pattern:
#"""
(?xi)
(?<!\p{L})
(?:€|\$|£|₺|₽|₪|₩|₴|¥|₹|₫
   | \b(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF|BGN|RSD|UAH|RUB|TRY|SEK|NOK|DKK|ISK|ILS|AED|SAR|JPY|CNY|INR|KRW|CAD|AUD|NZD|MXN|BRL|KČ|FT)\b
   | Kč | Ft | \bLE[I1l]\b
)? \s*
\d{1,5}
(?:[.,]\d{3})*
(?:[.,]\d{1,2})?
(?:\s*
   (?:€|\$|£|₺|₽|₪|₩|₴|¥|₹|₫
     | \b(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF|BGN|RSD|UAH|RUB|TRY|SEK|NOK|DKK|ISK|ILS|AED|SAR|JPY|CNY|INR|KRW|CAD|AUD|NZD|MXN|BRL|KČ|FT)\b
     | Kč | Ft | \bLE[I1l]\b
   )
)?
"""#, options: [])


/// Whole line that is purely an allergen tuple like "(1,2,8,10)".
private let ALLERGEN_LINE_REGEX = try! NSRegularExpression(
  pattern: #"^\s*\(\s*\d{1,2}(?:\s*,\s*\d{1,2})+\s*\)\s*$"#,
  options: [.caseInsensitive, .anchorsMatchLines]
)
private func looksLikeAllergenTrail(_ rightContext: String) -> Bool {
  let ns = rightContext as NSString
  let r  = NSRange(location: 0, length: ns.length)
  return ALLERGEN_TRAIL_REGEX.firstMatch(in: rightContext, options: [], range: r) != nil
}
/// Returns true if a line is exactly an allergen tuple.
private func isAllergenLine(_ s: String) -> Bool {
  return ALLERGEN_LINE_REGEX.firstMatch(in: s, options: [],
                                        range: NSRange(location: 0, length: (s as NSString).length)) != nil
}

/// Regex helpers
private func hasMatch(_ re: NSRegularExpression, in s: String) -> Bool {
  re.firstMatch(in: s, options: [], range: NSRange(location: 0, length: (s as NSString).length)) != nil
}
private func isWholeMatch(_ re: NSRegularExpression, in s: String) -> Bool {
  re.firstMatch(in: s, options: [], range: NSRange(location: 0, length: (s as NSString).length)) != nil
}
private func ignoredRanges(in s: String) -> [NSRange] {
  let ns = s as NSString
  let whole = NSRange(location: 0, length: ns.length)
  return IGNORE_SPANS_REGEX.matches(in: s, options: [], range: whole).map { $0.range }
}
private func intersectsAny(_ r: NSRange, _ ranges: [NSRange]) -> Bool {
  for q in ranges { if NSIntersectionRange(r, q).length > 0 { return true } }
  return false
}

/// Alias table used to normalize found currency tokens → ISO codes.
private let CURRENCY_ALIASES: [String: String] = [
"ron":"RON","lei":"RON","leu":"RON","lei.":"RON","ron.":"RON",
  "let":"RON","le1":"RON","lel":"RON",
  "usd": "USD", "$": "USD", "us$": "USD",
  "gbp": "GBP", "£": "GBP",

  "chf": "CHF", "fr": "CHF", "sfr": "CHF",
  "pln": "PLN", "zł": "PLN", "zl": "PLN",
  "czk": "CZK", "kč": "CZK", "kc": "CZK", "kč.": "CZK",
  "huf": "HUF", "ft": "HUF", "ft.": "HUF",
  "bgn": "BGN", "лв": "BGN", "лв.": "BGN", "leva": "BGN", "lev": "BGN",
  "rsd": "RSD", "din": "RSD", "дин": "RSD", "дин.": "RSD",
  "uah": "UAH", "₴": "UAH", "грн": "UAH", "грн.": "UAH",
  "rub": "RUB", "₽": "RUB", "руб": "RUB", "руб.": "RUB",
  "try": "TRY", "₺": "TRY", "tl": "TRY",

  "sek": "SEK", "nok": "NOK", "dkk": "DKK", "isk": "ISK",

  "ils": "ILS", "₪": "ILS", "nis": "ILS",
  "aed": "AED", "د.إ": "AED", "dirham": "AED",
  "sar": "SAR", "ر.س": "SAR",

  "jpy": "JPY", "¥": "JPY", "円": "JPY",
  "cny": "CNY", "rmb": "CNY", "元": "CNY", "人民币": "CNY",
  "inr": "INR", "₹": "INR", "rs": "INR", "rupees": "INR",
  "krw": "KRW", "₩": "KRW",

  "cad": "CAD", "c$": "CAD",
  "aud": "AUD", "a$": "AUD",
  "nzd": "NZD", "nz$": "NZD",
  "mxn": "MXN", "mex$": "MXN", "m$x": "MXN",
  "brl": "BRL", "r$": "BRL"
]

/// Normalizes one currency token (symbol/word) to an ISO code when known.
private func normalizeCurrency(_ raw: String) -> String {
  let k = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  return CURRENCY_ALIASES[k] ?? raw.uppercased()
}
