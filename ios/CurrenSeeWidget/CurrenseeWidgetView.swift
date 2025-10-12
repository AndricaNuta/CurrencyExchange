import SwiftUI
import WidgetKit

enum WidgetTheme {
    static let purple     = Color(red: 0.28, green: 0.23, blue: 0.63)
    static let purpleCard = Color(red: 0.33, green: 0.28, blue: 0.72)
    static let text       = Color.white
    static let subtext    = Color.white.opacity(0.70)
}

struct CurrenSeeWidgetView: View {
    let entry: RateEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            switch family {
            case .accessoryInline:
                if let p = entry.pairs.first {
                    Text("\(p.from)→\(p.to) \(formatRate(p.rate))")
                } else {
                    Text("Add pair")
                }

            case .accessoryCircular:
              ZStack {
                if let p = entry.pairs.first {
                  VStack(spacing: 2) {
                    // Line 1: Currencies
                    Text("\(p.from.prefix(2)) → \(p.to.prefix(2))")
                      .font(.system(size: 10, weight: .semibold))
                      .minimumScaleFactor(0.7)
                      .foregroundStyle(WidgetTheme.text)
                    
                    // Line 2: Rate
                    Text(formatRate(p.rate))
                      .font(.system(size: 10, weight: .bold))
                      .monospacedDigit()
                      .foregroundStyle(WidgetTheme.subtext)
                  }
                } else {
                  Image(systemName: "dollarsign.circle")
                    .font(.system(size: 12))
                    .foregroundStyle(WidgetTheme.subtext)
                } }

            case .accessoryRectangular:
                if let p = entry.pairs.first {
                  HStack(spacing: 1) {
                             // From flag and code
                             Text(flag(for: p.from))
                                 .font(.system(size: 10))
                             Text(p.from)
                                 .font(.system(size: 12, weight: .semibold))
                             
                             Image(systemName: "arrow.right")
                                 .font(.system(size: 10, weight: .bold))
                                 .foregroundStyle(.gray.opacity(0.8))
                             
                             // To flag and code
                             Text(flag(for: p.to))
                                 .font(.system(size: 10))
                             Text(p.to)
                                 .font(.system(size: 12, weight: .semibold))
                             
                             Spacer(minLength: 4)
                             
                             // Rate
                             Text(formatRate(p.rate))
                                 .font(.system(size: 12, weight: .bold))
                                 .monospacedDigit()
                                 .foregroundStyle(WidgetTheme.text)
                         }
                    Text("Add favorites in app").font(.system(size: 12))
                }

            case .systemSmall:
                VStack(spacing: 8) {
                    ForEach(entry.pairs.prefix(2), id: \.self) { SmallRow(pair: $0) }
                }

            case .systemMedium:
                let cols = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
                LazyVGrid(columns: cols, spacing: 8) {
                    ForEach(entry.pairs.prefix(4), id: \.self) { CompactCard(pair: $0) }
                }
                .padding(8)

            default:
                VStack(spacing: 8) {
                    ForEach(entry.pairs.prefix(2), id: \.self) { SmallRow(pair: $0) }
                }
            }
        }
        // ✅ Always adopt widget container background (fixes the “Please adopt …” tile)
        .containerBackground(for: .widget) { WidgetTheme.purple }
        .tint(.white)
        .widgetAccentable(true)
        .foregroundStyle(.primary)// ✅ Tight, standard margins for Home Screen (ignored on Lock Screen)
        .applyTightMargins(11)

        // ✅ Deeplink (safe optional)
        .widgetURL(entry.pairs.first.flatMap { URL(string: "currensee://pair?from=\($0.from)&to=\($0.to)") })
    }


    // MARK: - helpers
    private func formatRate(_ d: Double) -> String {
        let f = NumberFormatter()
        f.maximumFractionDigits = 4
        f.minimumFractionDigits = 2
        return f.string(from: d as NSNumber) ?? "\(d)"
    }

    private func flag(for code: String) -> String {
        let cc = code.prefix(2).uppercased()
        let scalars = cc.unicodeScalars.map { 127397 + $0.value }
        return String(String.UnicodeScalarView(scalars.compactMap(UnicodeScalar.init)))
    }
}

// MARK: - Home screen rows / cards

private struct SmallRow: View {
    let pair: FavoritePair
    var body: some View {
        VStack(spacing: 6) {
            PairPill(from: pair.from, to: pair.to)
            Text(format(pair.rate))
                .font(.system(size: 26, weight: .heavy, design: .rounded))
                .foregroundStyle(WidgetTheme.text)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .padding(.horizontal, 6)
        .background(WidgetTheme.purpleCard, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(.white.opacity(0.14), lineWidth: 1))
    }
    private func format(_ d: Double) -> String {
        let f = NumberFormatter(); f.maximumFractionDigits = 4; f.minimumFractionDigits = 2
        return f.string(from: d as NSNumber) ?? "\(d)"
    }
}

private struct CompactCard: View {
    let pair: FavoritePair
    var body: some View {
        VStack(spacing: 4) {
            PairPill(from: pair.from, to: pair.to, font: 10)
            Text(format(pair.rate))
                .font(.system(size: 20, weight: .heavy, design: .rounded))
                .foregroundStyle(WidgetTheme.text)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .padding(.horizontal, 8)
        .background(WidgetTheme.purpleCard, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(.white.opacity(0.14), lineWidth: 1))
    }
    private func format(_ d: Double) -> String {
        let f = NumberFormatter(); f.maximumFractionDigits = 4; f.minimumFractionDigits = 2
        return f.string(from: d as NSNumber) ?? "\(d)"
    }
}

private struct PairPill: View {
    let from: String
    let to: String
    var font: CGFloat = 10
    var body: some View {
        HStack(spacing: 6) {
            Text(flag(for: from)).font(.system(size: font - 1))
            Text(from).font(.system(size: font, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
            Image(systemName: "arrow.right").font(.system(size: font, weight: .bold)).foregroundStyle(.white.opacity(0.9))
            Text(flag(for: to)).font(.system(size: font - 1))
            Text(to).font(.system(size: font, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
        }
        .foregroundStyle(WidgetTheme.text)
        .padding(.horizontal, 6)
        .padding(.vertical, 5)
        .frame(maxWidth: .infinity)
        .background(.white.opacity(0.10), in: Capsule())
        .overlay(Capsule().stroke(.white.opacity(0.16), lineWidth: 1))
    }
    private func flag(for code: String) -> String {
        let cc = code.prefix(2).uppercased()
        let scalars = cc.unicodeScalars.map { 127397 + $0.value }
        return String(String.UnicodeScalarView(scalars.compactMap(UnicodeScalar.init)))
    }
}

// MARK: - Margins helper (Home Screen only; Lock Screen ignores it)

private extension View {
    @ViewBuilder func applyTightMargins(_ inset: CGFloat = 11) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.contentMargins(.all, inset)   // 11 = tight Apple-recommended
        } else {
            self
        }
    }
}

// MARK: - Previews
#if DEBUG
struct CurrenSeeWidgetView_Previews: PreviewProvider {
    static var previews: some View {
        CurrenSeeWidgetView(
            entry: RateEntry(
                date: .now,
                pairs: [
                    FavoritePair(from: "EUR", to: "USD", rate: 1.0724, updatedAt: .now),
                    FavoritePair(from: "USD", to: "BRL", rate: 5.31,    updatedAt: .now),
                    FavoritePair(from: "USD", to: "RON", rate: 4.62,    updatedAt: .now)
                ],
                configuration: .init()
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemSmall))

        CurrenSeeWidgetView(
            entry: RateEntry(
                date: .now,
                pairs: [
                    FavoritePair(from: "EUR", to: "USD", rate: 1.0724, updatedAt: .now),
                    FavoritePair(from: "USD", to: "BRL", rate: 5.31,    updatedAt: .now),
                    FavoritePair(from: "USD", to: "RON", rate: 4.62,    updatedAt: .now),
                    FavoritePair(from: "EUR", to: "GBP", rate: 0.86,    updatedAt: .now)
                ],
                configuration: .init()
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
#endif
