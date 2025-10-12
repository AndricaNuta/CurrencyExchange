//
//  CurrenSeeWidgetLiveActivity.swift
//  CurrenSeeWidget
//
//  Created by Andreea Nuta on 10.10.2025.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct CurrenSeeWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct CurrenSeeWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CurrenSeeWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension CurrenSeeWidgetAttributes {
    fileprivate static var preview: CurrenSeeWidgetAttributes {
        CurrenSeeWidgetAttributes(name: "World")
    }
}

extension CurrenSeeWidgetAttributes.ContentState {
    fileprivate static var smiley: CurrenSeeWidgetAttributes.ContentState {
        CurrenSeeWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: CurrenSeeWidgetAttributes.ContentState {
         CurrenSeeWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: CurrenSeeWidgetAttributes.preview) {
   CurrenSeeWidgetLiveActivity()
} contentStates: {
    CurrenSeeWidgetAttributes.ContentState.smiley
    CurrenSeeWidgetAttributes.ContentState.starEyes
}
