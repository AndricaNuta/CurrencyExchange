import Foundation
import React
import WidgetKit

@objc(CurrenseeWidgetReload)
class CurrenseeWidgetReload: NSObject {
  @objc(reload)
  func reload() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      // or: WidgetCenter.shared.reloadTimelines(ofKind: "CurrenseeWidgetKind")
    }
  }
  @objc static func requiresMainQueueSetup() -> Bool { false }
}
