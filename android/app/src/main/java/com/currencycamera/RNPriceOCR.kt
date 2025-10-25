package com.currencycamera

import android.graphics.*
import android.net.Uri
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.InputStream
import java.util.regex.Pattern
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
private const val TAG = "RNPriceOCR"

class RNPriceOCR(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx) {

  override fun getName() = "RNPriceOCR"

  // --- JS API parity ---------------------------------------------------------

  @ReactMethod
  fun ping(promise: Promise) {
    promise.resolve("pong")
  }

  @ReactMethod
  fun detectTextInImage(uri: String, promise: Promise) {
    Log.d(TAG, "detectTextInImage(uri=$uri)")
    val activity = reactCtx.currentActivity ?: run {
      Log.w(TAG, "E_NO_ACTIVITY")
      promise.reject("E_NO_ACTIVITY", "No current Activity")
      return
    }

    val bmp = loadBitmap(uri)
    if (bmp == null) {
      Log.e(TAG, "E_IMAGE: Cannot load image at $uri")
      promise.reject("E_IMAGE", "Cannot load image at $uri", null); return
    }
    val width  = bmp.width
    val height = bmp.height
    Log.d(TAG, "bitmap loaded ${width}x${height}")

    val image = InputImage.fromBitmap(bmp, 0)
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    recognizer.process(image)
      .addOnSuccessListener { result ->
        try {
          val linesArray  = Arguments.createArray()
          val pricesArray = Arguments.createArray()
          val allLines    = mutableListOf<KLine>() // <--- collect for label matching

          var lineIndex = 0
          var blockIndex = 0

          Log.d(TAG, "MLKit blocks=${result.textBlocks.size}")

          for (block in result.textBlocks) {
            Log.d(TAG, "block#$blockIndex lines=${block.lines.size}")
            for (line in block.lines) {
              val raw = (line.text ?: "").trim()
              val lineBox = (line.boundingBox ?: Rect(0,0,0,0))
              val lm = Arguments.createMap().apply {
                putString("text", raw)
                putMap("box", rectToBox(lineBox, width, height))
                putMap("quad", pointsToQuad(line.cornerPoints, lineBox, width, height))
                putInt("lineIndex", lineIndex)
                putInt("blockIndex", blockIndex)
              }
              linesArray.pushMap(lm)
              allLines += KLine(raw, Rect(lineBox), lineIndex, blockIndex)

              // --- Price candidates on this line (regex-based)
              val matcher = PRICE_LAX.matcher(raw)
              while (matcher.find()) {
                val priceText = matcher.group()?.trim() ?: continue
                val start = matcher.start()
                val end   = matcher.end()
                Log.d(TAG, "candidate L$lineIndex \"$priceText\" in \"$raw\" [$start,$end)")

                // 1) Skip units like 300 g, 0.5L, 250ml
                if (unitRightAfter(raw, end) || unitRightBefore(raw, start)) {
                  Log.d(TAG, "skip: unit next to number")
                  continue
                }

                // 2) Currency must be near OR the number must look like a price (two decimals)
                val nearbyCurrency = firstCurrency(priceText) ?: currencyNear(raw, start, end, 8)
                val hasTwoDecimals = TWO_DECIMALS.matcher(priceText).find()
                if (nearbyCurrency == null && !hasTwoDecimals) {
                  Log.d(TAG, "skip: no nearby currency and not 2-decimals")
                  continue
                }

                // 3) Compute label
                val label = findBestLabelForPrice(
                  priceText = priceText,
                  lineText  = raw,
                  priceBox  = lineBox,
                  lineIdx   = lineIndex,
                  lines     = allLines
                )
                Log.d(TAG, "label -> ${label ?: "(none)"}")

                val priceMap = Arguments.createMap().apply {
                  putString("text", priceText)
                  putDouble("confidence", 1.0)
                  putMap("box", rectToBox(lineBox, width, height))
                  putMap("quad", pointsToQuad(line.cornerPoints, lineBox, width, height))
                  putInt("lineIndex", lineIndex)
                  putString("lineText", raw)
                  putMap("lineBox", rectToBox(lineBox, width, height))
                  putMap("lineQuad", rectToQuad(lineBox, width, height))
                  if (label != null) putString("labelText", label) // <--- IMPORTANT
                }

                if (nearbyCurrency != null) {
                  priceMap.putString("rawCurrency", nearbyCurrency)
                  priceMap.putString("currencyCode", normalizeCurrency(nearbyCurrency))
                }

                pricesArray.pushMap(priceMap)
              }

              lineIndex++
            }
            blockIndex++
          }

          val out = Arguments.createMap().apply {
            putInt("width", width)
            putInt("height", height)
            putInt("rotation", 0)
            putArray("words", Arguments.createArray())
            putArray("lines", linesArray)
            putArray("prices", pricesArray)
          }
          Log.d(TAG, "done: lines=${allLines.size} prices=${pricesArray.size()}")
          emitDebug("DONE", "lines=${allLines.size} prices=${pricesArray.size()}")

          promise.resolve(out)
        } catch (t: Throwable) {
          Log.e(TAG, "E_OCR post-processing: ${t.message}", t)
          promise.reject("E_OCR", "Post-processing failed: ${t.message}", t)
        }
      }
      .addOnFailureListener { e ->
        Log.e(TAG, "E_OCR: ${e.message}", e)
        promise.reject("E_OCR", "Text recognition failed: ${e.message}", e)
      }
  }

  // --- Geometry helpers (normalized top-left coords, like iOS) --------------
  private fun rectToBox(r: Rect, imgW: Int, imgH: Int): WritableMap {
    val m = Arguments.createMap()
    val x = r.left.toFloat() / imgW
    val w = r.width().toFloat() / imgW
    val yTopLeft = r.top.toFloat() / imgH // top-left origin
    val h = r.height().toFloat() / imgH
    m.putDouble("x", x.toDouble())
    m.putDouble("y", yTopLeft.toDouble())
    m.putDouble("width", w.toDouble())
    m.putDouble("height", h.toDouble())
    return m
  }

  private fun rectToQuad(r: Rect, imgW: Int, imgH: Int): WritableMap {
    // axis-aligned fallback
    val tl = point(r.left,  r.top,    imgW, imgH)
    val tr = point(r.right, r.top,    imgW, imgH)
    val br = point(r.right, r.bottom, imgW, imgH)
    val bl = point(r.left,  r.bottom, imgW, imgH)
    return quad(tl, tr, br, bl)
  }

  private fun pointsToQuad(pts: Array<Point>?, fallback: Rect, imgW: Int, imgH: Int): WritableMap {
    if (pts == null || pts.size < 4) return rectToQuad(fallback, imgW, imgH)

    // ML Kit cornerPoints order is typically TL, TR, BR, BL; be defensive
    val sorted = pts.sortedWith(compareBy<Point> { it.y }.thenBy { it.x }) // top two then bottom two
    val topTwo = sorted.take(2).sortedBy { it.x }
    val botTwo = sorted.takeLast(2).sortedBy { it.x }

    val tl = point(topTwo[0].x, topTwo[0].y, imgW, imgH)
    val tr = point(topTwo[1].x, topTwo[1].y, imgW, imgH)
    val bl = point(botTwo[0].x, botTwo[0].y, imgW, imgH)
    val br = point(botTwo[1].x, botTwo[1].y, imgW, imgH)
    return quad(tl, tr, br, bl)
  }

  private fun point(xPx: Int, yPx: Int, imgW: Int, imgH: Int): WritableMap {
    val m = Arguments.createMap()
    m.putDouble("x", xPx.toDouble() / imgW)
    m.putDouble("y", yPx.toDouble() / imgH) // top-left origin
    return m
  }

  private fun quad(tl: WritableMap, tr: WritableMap, br: WritableMap, bl: WritableMap): WritableMap {
    val m = Arguments.createMap()
    m.putMap("topLeft", tl)
    m.putMap("topRight", tr)
    m.putMap("bottomRight", br)
    m.putMap("bottomLeft", bl)
    return m
  }

  // --- Image loading & EXIF orientation -------------------------------------

  private fun loadBitmap(uriString: String): Bitmap? {
    return try {
      val uri = if (uriString.startsWith("file://")) Uri.parse(uriString) else {
        // accept raw path too
        if (uriString.startsWith("/")) Uri.parse("file://$uriString") else Uri.parse(uriString)
      }

      val resolver = reactCtx.contentResolver
      val stream: InputStream? = when (uri.scheme) {
        "file" -> java.io.FileInputStream(uri.path!!)
        "content" -> resolver.openInputStream(uri)
        else -> java.io.FileInputStream(uri.path!!)
      }

      stream.use { ins ->
        val bytes = ins?.readBytes() ?: return null
        val exif = ExifInterface(bytes.inputStream())
        val bmp0 = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null
        applyExifRotation(bmp0, exif)
      }
    } catch (_: Throwable) {
      null
    }
  }

  private fun applyExifRotation(src: Bitmap, exif: ExifInterface): Bitmap {
    val orientation = exif.getAttributeInt(
      ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL
    )
    val m = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90  -> m.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> m.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> m.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.preScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL   -> m.preScale(1f, -1f)
      else -> { /* no-op */ }
    }
    return if (!m.isIdentity) Bitmap.createBitmap(src, 0, 0, src.width, src.height, m, true) else src
  }

  // --- Currency / price regex + helpers (portable subset of your iOS logic) --
private val UNIT_NEARBY: Pattern = Pattern.compile(
  """(?ix)\b(?:g|gr|gram(?:e|a|as|s)?|kg|mg|ml|cl|dl|l|lit(?:er|re)s?|oz|fl\.?oz|lb|lbs|cm|mm|m)\b"""
)

// Price-like decimals (…, 2 decimals). Accept comma or dot.
private val TWO_DECIMALS: Pattern = Pattern.compile("""(?ix)\d+[.,]\d{2}\b""")

private fun unitRightAfter(s: String, idx: Int): Boolean {
  val after = s.substring(idx)
  val m = UNIT_NEARBY.matcher(after)
  // only if the unit is immediately after the number (skipping spaces)
  return m.find() && m.start() <= after.indexOfFirst { !it.isWhitespace() }.coerceAtLeast(0)
}

private fun unitRightBefore(s: String, idx: Int): Boolean {
  val before = s.substring(0, idx)
  val m = UNIT_NEARBY.matcher(before)
  // only if the unit is immediately before the number (ignoring trailing spaces)
  return m.find() && m.end() >= before.trimEnd().length
}

// Only treat currency on the same line as relevant if it is near the number
private fun currencyNear(s: String, start: Int, end: Int, window: Int = 6): String? {
  val L = max(0, start - window)
  val R = min(s.length, end + window)
  val around = s.substring(L, R)
  val m = CURRENCY_NEARBY.matcher(around)
  return if (m.find()) m.group() else null
}
  // Currency tokens (symbols + ISO + common aliases)
  private val CURRENCY_NEARBY: Pattern = Pattern.compile(
    """
    (?ix)
    ( €|\$|£|₺|₽|₪|₩|₴|¥|₹|₫
    | \b(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF|BGN|RSD|UAH|RUB|TRY|SEK|NOK|DKK|ISK|ILS|AED|SAR|JPY|CNY|INR|KRW|CAD|AUD|NZD|MXN|BRL|KČ|FT)\b
    | Kč | Ft | \bLE[I1l]\b
    )
    """.trimIndent(),
    Pattern.CASE_INSENSITIVE or Pattern.COMMENTS
  )

  // Broad price pattern (optional currency before/after, thousands, decimals)
  private val PRICE_LAX: Pattern = Pattern.compile(
    """
    (?ix)(?<!\p{L})
    (?:€|\$|£|₺|₽|₪|₩|₴|¥|₹|₫
       | \b(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF|BGN|RSD|UAH|RUB|TRY|SEK|NOK|DKK|ISK|ILS|AED|SAR|JPY|CNY|INR|KRW|CAD|AUD|NZD|MXN|BRL|KČ|FT)\b
       | Kč | Ft | \bLE[I1l]\b
    )? \s*
    \d{1,5} (?:[.,]\d{3})* (?:[.,]\d{1,2})?
    (?:\s*
       (?:€|\$|£|₺|₽|₪|₩|₴|¥|₹|₫
         | \b(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF|BGN|RSD|UAH|RUB|TRY|SEK|NOK|DKK|ISK|ILS|AED|SAR|JPY|CNY|INR|KRW|CAD|AUD|NZD|MXN|BRL|KČ|FT)\b
         | Kč | Ft | \bLE[I1l]\b
       )
    )?
    """.trimIndent(),
    Pattern.CASE_INSENSITIVE or Pattern.COMMENTS
  )

  private fun firstCurrency(s: String): String? {
    val m = CURRENCY_NEARBY.matcher(s)
    return if (m.find()) m.group() else null
  }

  private fun currencyAnywhere(s: String): String? = firstCurrency(s)

  private val CURRENCY_ALIASES = mapOf(
    "ron" to "RON","lei" to "RON","leu" to "RON","lei." to "RON","ron." to "RON",
    "let" to "RON","le1" to "RON","lel" to "RON",
    "usd" to "USD", "$" to "USD", "us$" to "USD",
    "gbp" to "GBP", "£" to "GBP",
    "eur" to "EUR", "euro" to "EUR", "€" to "EUR",
    "chf" to "CHF", "fr" to "CHF", "sfr" to "CHF",
    "pln" to "PLN", "zł" to "PLN", "zl" to "PLN",
    "czk" to "CZK", "kč" to "CZK", "kc" to "CZK", "kč." to "CZK",
    "huf" to "HUF", "ft" to "HUF", "ft." to "HUF",
    "bgn" to "BGN", "лв" to "BGN", "лв." to "BGN", "leva" to "BGN", "lev" to "BGN",
    "rsd" to "RSD", "din" to "RSD", "дин" to "RSD", "дин." to "RSD",
    "uah" to "UAH", "₴" to "UAH", "грн" to "UAH", "грн." to "UAH",
    "rub" to "RUB", "₽" to "RUB", "руб" to "RUB", "руб." to "RUB",
    "try" to "TRY", "₺" to "TRY", "tl" to "TRY",
    "sek" to "SEK", "nok" to "NOK", "dkk" to "DKK", "isk" to "ISK",
    "ils" to "ILS", "₪" to "ILS", "nis" to "ILS",
    "aed" to "AED", "د.إ" to "AED", "dirham" to "AED",
    "sar" to "SAR", "ر.س" to "SAR",
    "jpy" to "JPY", "¥" to "JPY", "円" to "JPY",
    "cny" to "CNY", "rmb" to "CNY", "元" to "CNY", "人民币" to "CNY",
    "inr" to "INR", "₹" to "INR", "rs" to "INR", "rupees" to "INR",
    "krw" to "KRW", "₩" to "KRW",
    "cad" to "CAD", "c$" to "CAD",
    "aud" to "AUD", "a$" to "AUD",
    "nzd" to "NZD", "nz$" to "NZD",
    "mxn" to "MXN", "mex$" to "MXN", "m\$x" to "MXN",
    "brl" to "BRL", "r$" to "BRL"
  )

  private fun normalizeCurrency(raw: String): String {
    val k = raw.trim().lowercase()
    return CURRENCY_ALIASES[k] ?: raw.trim().uppercase()
  }
  private val HAS_LETTERS: Pattern = Pattern.compile("""\p{L}{2,}""")
  private fun looksLikePrice(s: String) = PRICE_LAX.matcher(s).find()

  // Clean dotted leaders etc: "Chicken .... 12.00" -> "Chicken"
  private fun stripLeadersAndTrails(s: String): String =
    s.replace("""[.\u00B7•·\-–—_]{2,}""".toRegex(), " ")
     .replace("""\s{2,}""".toRegex(), " ")
     .trim()
 private fun findBestLabelForPrice(
    priceText: String,
    lineText: String,
    priceBox: Rect,
    lineIdx: Int,
    lines: List<KLine>
  ): String? {
    // Same-line label: remove matched price, then tidy up
    val sameLineRemainder = stripLeadersAndTrails(
      lineText.replace(priceText, " ").trim()
    )
    if (sameLineRemainder.isNotEmpty() && !looksLikePrice(sameLineRemainder)) {
      return sameLineRemainder
    }

    // Otherwise: nearest non-price line on same row / to the left
    var best: Pair<String, Double>? = null
    val maxDy = priceBox.height() * 1.6

    for (ln in lines) {
      if (ln.index == lineIdx) continue
      val txt = ln.text.trim()
      if (txt.isEmpty()) continue
      if (looksLikePrice(txt)) continue

      val b = ln.box
      val dy = abs(b.centerY() - priceBox.centerY()).toDouble()
      if (dy > maxDy) continue

      val dxRight = priceBox.left - b.right // +ve if label is left of price
      val sameRowBonus = if (dy < priceBox.height() * 0.7) -10.0 else 0.0
      val leftBonus = if (dxRight >= -8) -20.0 else 0.0 // prefer left side

      val score = dy + sameRowBonus + leftBonus + max(0.0, -dxRight.toDouble()) * 0.02
      if (best == null || score < best!!.second) {
        best = stripLeadersAndTrails(txt) to score
      }
    }
    return best?.first
  }
  private fun emitDebug(step: String, msg: String, extras: WritableMap? = null) {
  try {
    Log.d(TAG, "[$step] $msg ${extras ?: ""}")
    val m = Arguments.createMap()
    m.putString("step", step)
    m.putString("msg", msg)
    if (extras != null) m.putMap("data", extras)
    reactCtx
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("RNPriceOCR_DEBUG", m)
  } catch (_: Throwable) {
    // ignore
  }
}
  private data class KLine(                    // collected line for label matching
    val text: String,
    val box: Rect,
    val index: Int,
    val blockIndex: Int
  )
}
