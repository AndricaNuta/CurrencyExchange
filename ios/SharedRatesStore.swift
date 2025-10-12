//
//  SharedRatesStore.swift
//  CurrencyCamera
//
//  Created by Andreea Nuta on 10.10.2025.
//

import Foundation

public struct FavoritePair: Codable, Hashable {
    public let from: String
    public let to: String
    public let rate: Double
    public let updatedAt: Date

    public init(from: String, to: String, rate: Double, updatedAt: Date) {
        self.from = from; self.to = to; self.rate = rate; self.updatedAt = updatedAt
    }
}
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

public enum SharedRatesStore {
    static let appGroupId = "group.com.andrica.currensee.widget"
    static let fileName = "favorites.json"

    private static var fileURL: URL {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupId)!
            .appendingPathComponent(fileName)
    }

    public static func debugPath() -> String { fileURL.path }

  public static func load() -> [FavoritePair] {
      guard let data = try? Data(contentsOf: fileURL) else { return [] }
      let dec = makeLenientJSONDecoder()
      return (try? dec.decode([FavoritePair].self, from: data)) ?? []
  }

    public static func save(_ items: [FavoritePair]) {
        let enc = JSONEncoder(); enc.dateEncodingStrategy = .iso8601
        guard let data = try? enc.encode(items) else { return }
        try? data.write(to: fileURL, options: [.atomic])
    }
}
