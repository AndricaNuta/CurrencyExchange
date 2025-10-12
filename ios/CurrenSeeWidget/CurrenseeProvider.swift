import WidgetKit
import SwiftUI

struct CurrenSeeProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> RateEntry {
        RateEntry(
            date: .now,
            pairs: [
                .init(from: "EUR", to: "USD", rate: 1.0724, updatedAt: .now),
                .init(from: "USD", to: "BRL", rate: 5.3108, updatedAt: .now)
            ],
            configuration: .init()
        )
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> RateEntry {
        .init(date: .now, pairs: SharedRatesStore.load(), configuration: configuration)
    }

    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<RateEntry> {
        let pairs = SharedRatesStore.load()
        let entry = RateEntry(date: .now, pairs: pairs, configuration: configuration)
        let next = Calendar.current.date(byAdding: .minute, value: 60, to: .now) ?? .now.addingTimeInterval(3600)
        return Timeline(entries: [entry], policy: .after(next))
    }
}
