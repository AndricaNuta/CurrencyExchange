import WidgetKit
import SwiftUI

// Internal so it matches FavoritePair's access level
struct RateEntry: TimelineEntry {
    let date: Date
    let pairs: [FavoritePair]           // from SharedRatesStore (App Group)
    let configuration: ConfigurationAppIntent
    init(date: Date, pairs: [FavoritePair], configuration: ConfigurationAppIntent) {
        self.date = date
        self.pairs = pairs
        self.configuration = configuration
    }
}

struct CurrenSeeWidget: Widget {
    private let kind = "CurrenSeeWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: ConfigurationAppIntent.self,
            provider: CurrenSeeProvider()
        ) { entry in
            CurrenSeeWidgetView(entry: entry) 
        }
        .configurationDisplayName("Favorite Rates")
        .description("See your tracked pairs.")
        .supportedFamilies([
            .accessoryInline, .accessoryCircular, .accessoryRectangular,
            .systemSmall, .systemMedium
        ])
    }
}
