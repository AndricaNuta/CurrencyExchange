//
//  CurrenseeSharedRatesModule.swift
//  CurrencyCamera
//
//  Created by Andreea Nuta on 10.10.2025.
//
import Foundation
import React


private let iso8601WithFractional: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
}()

private func makeLenientJSONDecoder() -> JSONDecoder {
    let dec = JSONDecoder()
    dec.dateDecodingStrategy = .custom { decoder in
        let s = try decoder.singleValueContainer().decode(String.self)
        // Try with fractional seconds first
        if let d = iso8601WithFractional.date(from: s) {
            return d
        }
        // Fallback to normal ISO8601
        if let d = ISO8601DateFormatter().date(from: s) {
            return d
        }
        throw DecodingError.dataCorrupted(.init(
            codingPath: decoder.codingPath,
            debugDescription: "Expected ISO8601 date (with or without fractional seconds). Got: \(s)"
        ))
    }
    return dec
}

@objc(CurrenseeSharedRates)
class CurrenseeSharedRates: NSObject {

  @objc(saveFavorites:)
  func saveFavorites(_ favoritesJson: String) {
    guard let data = favoritesJson.data(using: .utf8) else { return }
    let dec = makeLenientJSONDecoder()
    do {
      let items = try dec.decode([FavoritePair].self, from: data)
      SharedRatesStore.save(items)
    } catch {
      NSLog("[SharedRates] saveFavorites decode failed: \(error)")
    }
  }

  @objc(readFavoritesCount:rejecter:)
  func readFavoritesCount(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let items = SharedRatesStore.load()
    resolve(items.count)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
