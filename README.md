# CurrenSee

Scan prices on menus/receipts, detect amounts on‑device, and convert them with live FX rates. Built with React Native + TypeScript, offline‑first storage, and an iOS native OCR bridge.

---

## Get the app
- **iOS**: Available on the App Store → [Download] - SOON
 ![Home screen](docs/screenshots/home.png)
---

## Table of contents
1. Features
2. Tech stack
3. How it works (end‑to‑end)
4. Architecture
5. Project structure
6. Tech decisions & React Native practices
7. Configuration (.env)
8. Build notes (iOS & Android)
9. Privacy & security
10. Roadmap

---

## 1) Features
- **Scan & Convert**: live camera or photo → detect price amounts → convert to selected pair.
- **Quick pairs**: EU/US style favorites, swap, copy to clipboard.
- **Watchlist**: pin currency pairs, view current rate (optionally mini sparkline).
- **Rate alerts (optional)**: threshold notifications.
- **Offline‑friendly**: rates cached locally; last known rate available.
- **Widgets (iOS)**: small/medium Home Screen + Lock Screen accessories for quick glance.
- **Theming**: light/dark with a lilac/purple accent, accessible contrast.

![FAB](docs/screenshots/FAB.png)
![Watchlist](docs/screenshots/chart.png)

---

## 2) Tech stack — how & why

### App runtime
- **React Native 0.74+ · TypeScript · Hermes**
  **How**: strict TS across `src/*`; Hermes enabled in release/debug.
  **Why**: type‑safety for refactors; Hermes improves start‑up time and memory vs JSC.

### Navigation
- **React Navigation** (stack + tabs)
  **How**: typed route params; deep‑link configuration ready (no deferred DL).
  **Why**: ubiquitous, battle‑tested, good TypeScript story.

### State — Redux Toolkit
- **How**: `src/redux/store.ts` with slices: `exchange`, `favorites`, `settings`; typed selectors; thin thunks for side‑effects.
  **Why**: predictable global state across screens; minimal boilerplate; easier debugging and time‑travel. Keeps components lean by moving logic to slices/services.

### Storage — MMKV
- **How**: `src/storage/mmkv.ts` helpers; persists cached FX rates, watchlist, user prefs, and one‑time flags (onboarding/tooltips).
  **Why**: ultra‑fast synchronous reads for cold start; better UX than AsyncStorage for frequently‑read values.

### Native & platform
- **Native module (Swift + Apple Vision)** for on‑device OCR; SwiftUI + **WidgetKit** for iOS widgets.
  **How**: `ios/RNPriceOCR/*` bridged via a typed wrapper `src/native/priceOcr.ts`; widgets in a separate target share formatting utils.
  **Why**: private, low‑latency OCR (no network); widgets provide glanceable rates without opening the app.

### UI/UX
- **Reanimated 3**, **react‑native‑gesture‑handler**, **@gorhom/bottom‑sheet**, custom **ThemeProvider**.
  **How**: 60 fps interactions for FAB/bottom‑sheet, swipe gestures, and subtle screen transitions; tokens in `src/theme/*`.
  **Why**: modern, smooth UI with clear hierarchy and accessible contrast.

### Networking
- **fetch → Frankfurter API** with a small caching layer.
  **How**: `src/services/exchange.ts` does SWR‑style fetch: return cached rate immediately, then refresh and update store.
  **Why**: reliable public source; simple surface area; works well with offline cache.

### Build
- **iOS**: Xcode + CocoaPods; **Android**: Gradle (bare RN).
  **How**: pod install script for CI; ensure `NODE_BINARY=node`; align Gradle/NDK with RN version.
  **Why**: reproducible builds locally and in CI/CD.

### Notifications *(optional)*
- **FCM** for rate alerts when thresholds are crossed.
  **How**: schedule or trigger from app/edge; respects user consent.
  **Why**: timely updates even when the app is closed.

### Rate comparison & timing *(optional)*
- **Cloudflare Workers (Cron Triggers)** to snapshot rates and compute deltas server‑side.
  **How**: daily jobs pull Frankfurter, store last value (e.g., KV/DO), and notify when thresholds hit.
  **Why**: off‑device timing avoids battery drain and makes alerts predictable.

## 3) How price‑from‑images processing works
 How price‑from‑images processing works

```
[Camera / Image Picker]
       │
       ▼
[iOS Native OCR (Apple Vision)]  ──►  [RN Bridge]  ──►  [JS Parser: extract & validate prices]
       │                                    │
       │                                    ▼
       └─────────> (bounding boxes)   [Redux Toolkit store]
                                            │
                                            ▼
                                 [Exchange Service]
                               (Frankfurter API + cache)
                                            │
                                            ▼
                                      [UI Components]
                                            │
                                            └──► [MMKV persist]
```

### 3.1 Image acquisition & metadata
- **Source**: live camera or gallery picker returns a file URI (`file://…` or `ph://…`) + width/height + EXIF orientation.
- **Why file URI (not base64)**: avoids giant strings across the bridge → lower memory, faster.
- **Pre‑normalize**: we fix orientation on the native side so Vision gets an upright `CGImage`.

### 3.2 Native module (Swift + Apple Vision)
- **Module name**: `RNPriceOCR` (Swift) exposed to JS as `NativeModules.RNPriceOCR` (wrapped in `src/native/priceOcr.ts`).
- **Public API** (Promise):
  - `detectPrices({ uri, width, height, crop?: Rect, languages?: string[] }) -> Promise<OCRResult[]>`
- **Threading**: work runs on a background queue; only the final resolve/reject touches the JS thread.
- **Vision setup**:
  - `VNRecognizeTextRequest` with `.accurate` (fallback to `.fast` if low memory).
  - `recognitionLanguages`: configurable (e.g., `en-US`, `ro-RO`, `es-ES`, `de-DE`, `fr-FR`).
  - `usesLanguageCorrection = false` (reduces "auto-fixes" that can break prices).
  - Optional `regionOfInterest` if the caller passes a `crop` (speeds up scanning receipts where prices are in a column).
- **Preprocessing**:
  - Downscale very large images to a safe max dimension (e.g., 2048 px) to reduce Vision time & memory.
  - Convert to grayscale where helpful (Vision is robust, so this is optional).
- **Output**: for each recognized line we emit:
  ```ts
  type OCRResult = {
    text: string;            // raw recognized text for the line
    confidence: number;      // 0..1 average confidence
    bbox: { x: number; y: number; width: number; height: number; }; // normalized (0..1) in image space
  }
  ```

### 3.3 Bounding boxes → JS overlay
- Vision provides **normalized** boxes in the image’s coordinate space; we convert to **view space** on JS:
  1) de‑normalize: `px = bbox * imagePixelSize`
  2) account for orientation + any downscale ratio applied in native
  3) map to the displayed image size (fit/contain); we use the same scale/offset as the `<Image>` element
- Result: drawn rectangles align with what the user sees, enabling **tap to select a price**.

### 3.4 JS parser & heuristics (turn OCR text into prices)
We parse each line using locale‑aware rules and filter out false positives.

**Patterns accepted** (examples):
- Prefix symbol: `€12,50`, `$9.99`, `£7.95`
- Suffix code/symbol: `12.50 EUR`, `9,99 RON`, `7.95 lei`
- Spaced variants: `€ 12,50`, `12,50 €`, `12.50  EUR`

**Normalization**:
- Detect decimal mark: if both `,` and `.` exist, the right‑most one is the decimal separator; the other is thousands.
- Remove thin/non‑breaking spaces and group separators; unify decimals to `.` internally.
- Keep 0–3 decimals; clamp weird cases (e.g., `12,9999`).

**False‑positive filters**:
- Phone numbers / long IDs: reject if ≥7 consecutive digits or matches `+XX …` formats.
- Weights/volumes: reject tokens followed by `g`, `kg`, `ml`, `cl`, `l`, `pcs`.
- Ranges: `12–15` treated as non‑price unless a currency marker is present.
- Time: `12:30`, `08.00` rejected unless currency present.

Each accepted candidate is emitted as:
```ts
{
  amount: number;          // normalized numeric value
  currencyHint?: string;   // e.g., "EUR", "RON", inferred from symbol/code if present
  sourceText: string;      // original OCR line
  bbox: Rect;              // mapped to view space for highlighting
}
```

### 3.5 Rates & caching
- The **Exchange Service** checks MMKV for a cached rate for `base→quote` (with TTL). If stale or missing, it fetches fresh data from Frankfurter and updates the cache.
- UI shows the cached conversion immediately (SWR), then updates if a newer rate arrives.

### 3.6 State updates & UI
- Accepted price candidates are stored in Redux (slice: `exchange` or a dedicated `scan` slice).
- The **Scan screen** renders bounding boxes; tapping one selects it, updates the conversion card, and allows Copy/Share.

### 3.7 Errors & fallbacks
- If OCR fails (e.g., image unreadable), we still allow manual input conversion.
- For missing network, last known rate is used with a small "cached" badge.

### 3.8 Performance tips
- Use **file URIs** over base64; apply downscaling natively for huge photos.
- Batch results across the bridge (one resolve with an array).
- Debounce re‑runs when users switch photos quickly.
- Keep the Vision request alive if scanning multiple shots in a session to reuse internal models.

### 3.9 Privacy
- Images never leave the device during OCR. Only numeric prices chosen by the user are stored (locally) for recent history.

## 4) Architecture

**Layers & responsibilities**
- **UI layer** (`/src/screens`, `/src/components`) – screens, presentational components, theming.
- **State layer** (`/src/redux`) – Redux Toolkit slices for exchange, favorites, settings.
- **Domain/services** (`/src/services`) – currency rates, caching, parsing & formatting utilities.
- **Native integration** (`/ios/RNPriceOCR`) – Swift + Apple Vision, exposed via a typed JS wrapper.
- **Persistence** (`/src/storage`) – MMKV for fast key‑value storage (rates, preferences, flags).

**Data flow**
- UI dispatches actions → slices update state → selectors feed UI.
- Side‑effects (fetch rates, read cache) live in thunks/hooks/services to keep components lean.

---

## 5) Project structure

```
.
├── src
│   ├── components/
│   ├── hooks/
│   ├── redux/
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── exchangeSlice.ts
│   │   │   ├── favoritesSlice.ts
│   │   │   └── settingsSlice.ts
│   ├── screens/
│   │   ├── ScanScreen/
│   │   ├── WatchlistScreen/
│   │   └── SettingsScreen/
│   ├── services/
│   │   ├── exchange.ts         // network + caching
│   │   ├── priceParser.ts      // extract/validate prices
│   │   └── format.ts           // number & currency formatting
│   ├── storage/
│   │   └── mmkv.ts             // keys + helpers
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   └── tokens.ts
│   └── native/
│       └── priceOcr.ts         // typed wrapper around native module
├── ios/RNPriceOCR/             // Swift + Apple Vision bridge
├── android/                    // Android project (camera + build configs)
├── .env.example
└── README.md
```
---

## 6) Tech decisions & React Native practices

**TypeScript (strict)**
- Safer refactors and better DX; typed module boundaries for OCR outputs, rate responses, and Redux state.

**Redux Toolkit for state**
- Co‑locates reducers/actions; immutable updates without boilerplate. Slices: `exchange`, `favorites`, `settings`.

**MMKV for persistence**
- Low‑latency storage for cached FX rates, watchlist, user prefs, and one‑time flags (e.g., onboarding tips).

**Native iOS module (Swift + Apple Vision)**
- Exposes `detectPrices(image)` with bounding boxes via RN bridge. Keeps OCR private & fast.

**Networking & caching**
- Frankfurter API client with stale‑while‑revalidate pattern: immediate cached rate, then refresh in background.

**Performance**
- Hermes engine, memoized selectors, FlatList virtualization, batched updates, and minimal re‑renders.

**UI & UX**
- Custom theme (light/dark), curved bottom bar + radial FAB, bottom sheets (Gorhom), first‑time tooltips.

**Platform features**
- iOS WidgetKit widgets (Small/Medium + accessory variants). Optional push notifications for rate alerts.

**Build/CI notes**
- iOS: CocoaPods post‑clone script to ensure `pod install` in CI. Android: Gradle version alignment + NDK notes.

---

## 7) Build notes *(for contributors)*

**iOS**
- Open `ios/*.xcworkspace` in Xcode for local releases.
- If Archive fails on CI, ensure the post‑clone script installs pods and that `NODE_BINARY` is set (e.g., `export NODE_BINARY=node`).
- Widgets: target `CurrenSeeWidget` with shared code for rate formatting.

**Android**
- Ensure Java, Gradle, and NDK versions match RN requirements.
- Clear builds if low‑disk errors occur: `cd android && ./gradlew clean`.

---

## 8) Privacy & security
- OCR runs **on‑device**; images never leave the device for recognition.
- Rates are fetched from a public API; no user PII is sent.
- Local cache is stored with MMKV.

---
