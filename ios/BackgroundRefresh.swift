//
//  BackgroundRefresh.swift
//  CurrencyCamera
//
//  Created by Andreea Nuta on 10.10.2025.
//

import BackgroundTasks
import WidgetKit

final class BackgroundRefresh {
    static let taskId = "com.andrica.currensee.refresh"

    static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskId, using: nil) { task in
            handle(task: task as! BGAppRefreshTask)
        }
    }

    static func schedule() {
        let req = BGAppRefreshTaskRequest(identifier: taskId)
        req.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60) // ~1h
        try? BGTaskScheduler.shared.submit(req)
    }

    private static func handle(task: BGAppRefreshTask) {
        schedule() // schedule next
        let op = RefreshRatesOperation()
        task.expirationHandler = { op.cancel() }
        op.completionBlock = {
            WidgetCenter.shared.reloadAllTimelines()
            task.setTaskCompleted(success: !op.isCancelled)
        }
        OperationQueue().addOperation(op)
    }
}

final class RefreshRatesOperation: Operation {
    override func main() {
        if isCancelled { return }
        // 1) Load favorites (from SharedRatesStore or your app’s source of truth)
        var favorites = SharedRatesStore.load()
        if favorites.isEmpty { return }

        // 2) Fetch fresh rates from Frankfurter for those pairs
        // Minimal example (sync-ish for brevity). Replace with a proper async fetch chain.
        let session = URLSession(configuration: .ephemeral)
        let group = DispatchGroup()
        var updated: [FavoritePair] = []

        for p in favorites.prefix(4) { // keep it light for background
            group.enter()
            let url = URL(string: "https://api.frankfurter.app/latest?from=\(p.from)&to=\(p.to)")!
            session.dataTask(with: url) { data, _, _ in
                defer { group.leave() }
                guard
                    let data,
                    let obj = try? JSONSerialization.jsonObject(with: data) as? [String:Any],
                    let rates = obj["rates"] as? [String:Double],
                    let rate = rates[p.to]
                else { return }
                updated.append(FavoritePair(from: p.from, to: p.to, rate: rate, updatedAt: Date()))
            }.resume()
        }

        group.wait()
        if !updated.isEmpty {
            SharedRatesStore.save(updated)
        }
    }
}
