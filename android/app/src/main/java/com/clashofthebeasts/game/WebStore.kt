package com.clashofthebeasts.game

import android.content.Context
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * The game's files on the phone (chủ game 30/10: the APK carries every file, and fetches what changed on `main`).
 *
 * offline-files.json, written by each web build, lists every file with a short hash. The APK carries the files of the
 * build it was made from (assets/web, listed in assets/web-manifest.json) and the pages (assets/pages). On each start
 * [sync] fetches the live list and downloads only the files whose hash differs from the copy carried in the APK, so a
 * new version on `main` reaches the app without a new APK. Files are served from the phone; pages come from the network
 * first (so a new version shows) and fall back to the kept copy; server calls always go to the network.
 * This does in the app what public/sw.js does in Chrome, which the app turns off (it would keep every file twice).
 */
class WebStore(private val context: Context) {
    companion object {
        const val HOST = "clashofthebeasts.vercel.app"
        const val ORIGIN = "https://$HOST"
        val PAGES = listOf("/", "/modes", "/deck", "/play", "/shop", "/collection", "/tune", "/watch", "/guide", "/hop-thu")
        private const val PAGE_WAIT_MS = 4000
        private const val FILE_WAIT_MS = 15000
        private val FONT_HOSTS = setOf("fonts.googleapis.com", "fonts.gstatic.com")
        private val PASS_HEADERS = setOf("user-agent", "accept", "accept-language")
        private val TYPES = mapOf(
            "html" to "text/html", "js" to "text/javascript", "mjs" to "text/javascript", "css" to "text/css",
            "json" to "application/json", "webmanifest" to "application/manifest+json", "txt" to "text/plain",
            "svg" to "image/svg+xml", "png" to "image/png", "jpg" to "image/jpeg", "jpeg" to "image/jpeg",
            "webp" to "image/webp", "gif" to "image/gif", "ico" to "image/x-icon", "avif" to "image/avif",
            "mp3" to "audio/mpeg", "m4a" to "audio/mp4", "ogg" to "audio/ogg", "wav" to "audio/wav",
            "webm" to "video/webm", "mp4" to "video/mp4", "woff" to "font/woff", "woff2" to "font/woff2",
            "ttf" to "font/ttf", "otf" to "font/otf", "wasm" to "application/wasm", "data" to "application/octet-stream",
        )
        private val TEXT = setOf("text/html", "text/javascript", "text/css", "application/json", "text/plain", "image/svg+xml", "application/manifest+json")
    }

    private val root = File(context.filesDir, "web")
    private val pagesDir = File(context.filesDir, "pages")
    private val fontsDir = File(context.filesDir, "fonts")
    private val metaFile = File(context.filesDir, "web-meta.json")
    private val listFile = File(context.filesDir, "web-list.json")

    /** The files carried in the APK. */
    private val carried: Map<String, String> = readList(context.assets.open("web-manifest.json").use { it.readBytes().decodeToString() })

    /** The newest list seen: what each file should be. */
    @Volatile private var wanted: Map<String, String> = (if (listFile.exists()) readList(listFile.readText()) else null) ?: carried

    /** Files downloaded since the APK was made, with their hash. */
    @Volatile private var fetched: Map<String, String> = (if (metaFile.exists()) readMap(metaFile.readText()) else null) ?: emptyMap()

    private fun readList(text: String): Map<String, String> = readMap(JSONObject(text).optJSONObject("files")?.toString() ?: "{}")

    private fun readMap(text: String): Map<String, String> = try {
        val json = JSONObject(text)
        json.keys().asSequence().associateWith { json.getString(it) }
    } catch (_: Exception) {
        emptyMap()
    }

    private fun writeMap(file: File, map: Map<String, String>) {
        val tmp = File(file.path + ".tmp")
        tmp.writeText(JSONObject(map).toString())
        tmp.renameTo(file)
    }

    private fun pageName(path: String) = if (path == "/") "index.html" else path.trim('/').replace('/', '_') + ".html"

    private fun typeOf(path: String): String = TYPES[path.substringAfterLast('.', "").lowercase()] ?: "application/octet-stream"

    // ---- Serving --------------------------------------------------------------------------------------------------

    fun intercept(request: WebResourceRequest): WebResourceResponse? {
        if (request.method != "GET") return null
        val url = request.url
        val host = url.host ?: return null
        if (host in FONT_HOSTS) return font(request)
        if (host != HOST) return null
        val path = url.path ?: "/"
        // Server calls (rooms, matchmaking, notes) always go to the network.
        if (path.startsWith("/_serverFn") || path.startsWith("/api/") || path.startsWith("/__")) return null
        // Chrome's worker keeps the files there; here the app does it.
        if (path == "/sw.js") return respond(404, "text/javascript", ByteArray(0))
        if (path == "/offline-files.json") return null
        if (request.isForMainFrame) return page(request, path)
        return file(request, path)
    }

    private fun respond(status: Int, type: String, body: ByteArray, extra: Map<String, String> = emptyMap()) =
        respond(status, type, ByteArrayInputStream(body), extra)

    private fun respond(status: Int, type: String, body: InputStream, extra: Map<String, String> = emptyMap()): WebResourceResponse {
        val headers = mutableMapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "no-cache")
        headers.putAll(extra)
        val reason = when (status) { 200 -> "OK"; 206 -> "Partial Content"; 404 -> "Not Found"; else -> "OK" }
        return WebResourceResponse(type, if (type in TEXT) "utf-8" else null, status, reason, headers, body)
    }

    /** A copy on the phone: downloaded first, then the one carried in the APK. `exact` asks for the newest only. */
    private fun local(path: String, exact: Boolean): (() -> InputStream)? {
        val hash = wanted[path]
        val down = File(root, path.trimStart('/'))
        val downHash = fetched[path]
        val carriedHash = carried[path]
        if (downHash != null && down.isFile && (!exact || downHash == hash)) return { down.inputStream() }
        if (carriedHash != null && (!exact || carriedHash == hash)) return { context.assets.open("web$path") }
        return null
    }

    private fun file(request: WebResourceRequest, path: String): WebResourceResponse? {
        if (path !in wanted && path !in carried) return null
        val open = local(path, exact = true) ?: run {
            // The newest copy is not here yet: the network, else whatever copy the phone has.
            val stale = local(path, exact = false) ?: return null
            val net = fetch(request.url.toString(), request, FILE_WAIT_MS)
            if (net != null && net.status == 200) return respond(200, typeOf(path), net.body)
            stale
        }
        val type = typeOf(path)
        val range = request.requestHeaders.entries.firstOrNull { it.key.equals("Range", true) }?.value
        if (range != null) {
            // Sound and video may ask for a part of the file.
            val body = open().use { it.readBytes() }
            val match = Regex("bytes=(\\d*)-(\\d*)").find(range)
            if (match != null && body.isNotEmpty()) {
                val (a, b) = match.destructured
                val start = a.toLongOrNull() ?: 0L
                val end = minOf(b.toLongOrNull() ?: (body.size - 1L), body.size - 1L)
                if (start <= end) {
                    val part = body.copyOfRange(start.toInt(), end.toInt() + 1)
                    return respond(206, type, part, mapOf(
                        "Content-Range" to "bytes $start-$end/${body.size}",
                        "Accept-Ranges" to "bytes",
                        "Content-Length" to part.size.toString(),
                    ))
                }
            }
            return respond(200, type, body, mapOf("Accept-Ranges" to "bytes", "Content-Length" to body.size.toString()))
        }
        return respond(200, type, open())
    }

    private fun page(request: WebResourceRequest, path: String): WebResourceResponse? {
        val net = fetch(request.url.toString(), request, PAGE_WAIT_MS)
        if (net != null && net.status == 200 && net.type.startsWith("text/html")) {
            if (path in PAGES) save(File(pagesDir, pageName(path)), net.body)
            return respond(200, "text/html", net.body)
        }
        if (net != null && net.status in 300..499) return null
        // No network: the copy kept from the last visit, else the one in the APK, else the menu.
        val name = if (path in PAGES) pageName(path) else pageName("/")
        for (candidate in listOf(name, pageName("/"))) {
            val kept = File(pagesDir, candidate)
            if (kept.isFile) return respond(200, "text/html", kept.readBytes())
            val inApk = try { context.assets.open("pages/$candidate").use { it.readBytes() } } catch (_: Exception) { null }
            if (inApk != null) return respond(200, "text/html", inApk)
        }
        return null
    }

    private fun font(request: WebResourceRequest): WebResourceResponse? {
        val url = request.url.toString()
        val kept = File(fontsDir, sha1(url))
        val keptType = File(kept.path + ".type")
        val refresh = {
            val net = fetch(url, request, FILE_WAIT_MS)
            if (net != null && net.status == 200) {
                save(kept, net.body)
                save(keptType, net.type.toByteArray())
            }
            net
        }
        if (kept.isFile) {
            // The kept copy at once; a fresh one for next time.
            Thread { refresh() }.start()
            val type = if (keptType.isFile) keptType.readText() else "text/css"
            return respond(200, type.substringBefore(';'), kept.readBytes())
        }
        val net = refresh()
        if (net == null || net.status != 200) return null
        return respond(200, net.type.substringBefore(';'), net.body)
    }

    // ---- Network --------------------------------------------------------------------------------------------------

    private class Got(val status: Int, val type: String, val body: ByteArray)

    private fun fetch(url: String, request: WebResourceRequest?, waitMs: Int): Got? = try {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = waitMs
        conn.readTimeout = waitMs
        conn.instanceFollowRedirects = true
        conn.useCaches = false
        request?.requestHeaders?.forEach { (key, value) -> if (key.lowercase() in PASS_HEADERS) conn.setRequestProperty(key, value) }
        val cookies = CookieManager.getInstance()
        cookies.getCookie(url)?.let { conn.setRequestProperty("Cookie", it) }
        val status = conn.responseCode
        conn.headerFields["Set-Cookie"]?.forEach { cookies.setCookie(url, it) }
        val body = (if (status < 400) conn.inputStream else conn.errorStream)?.use { it.readBytes() } ?: ByteArray(0)
        Got(status, conn.contentType ?: "application/octet-stream", body)
    } catch (_: Exception) {
        null
    }

    private fun save(file: File, body: ByteArray) {
        file.parentFile?.mkdirs()
        val tmp = File(file.path + ".tmp")
        tmp.writeBytes(body)
        tmp.renameTo(file)
    }

    private fun sha1(text: String) = MessageDigest.getInstance("SHA-1").digest(text.toByteArray()).joinToString("") { "%02x".format(it) }

    // ---- Updating -------------------------------------------------------------------------------------------------

    @Volatile private var syncing = false

    /** Downloads what changed on the live site, a few files at a time. Runs off the main thread. */
    fun sync() {
        if (syncing) return
        syncing = true
        Thread {
            try {
                syncNow()
            } catch (_: Exception) {
                // Tried again on the next start.
            } finally {
                syncing = false
            }
        }.start()
    }

    private fun syncNow() {
        val got = fetch("$ORIGIN/offline-files.json", null, FILE_WAIT_MS) ?: return
        if (got.status != 200) return
        val text = got.body.decodeToString()
        val list = readList(text)
        if (list.isEmpty()) return
        val have = fetched.toMutableMap()
        // Files that left the game, or whose copy in the APK is the newest again.
        for (path in have.keys.toList()) {
            if (list[path] == null || carried[path] == list[path]) {
                File(root, path.trimStart('/')).delete()
                have.remove(path)
            }
        }
        val want = list.filter { (path, hash) -> carried[path] != hash && have[path] != hash }.keys.toList()
        if (want.isNotEmpty()) {
            val lanes = Executors.newFixedThreadPool(4)
            for (path in want) {
                lanes.execute {
                    val file = fetch(ORIGIN + path, null, FILE_WAIT_MS)
                    if (file != null && file.status == 200) {
                        save(File(root, path.trimStart('/')), file.body)
                        synchronized(have) { have[path] = list.getValue(path) }
                    }
                }
            }
            lanes.shutdown()
            lanes.awaitTermination(30, TimeUnit.MINUTES)
        }
        synchronized(have) {
            writeMap(metaFile, have)
            fetched = have.toMap()
        }
        save(listFile, text.toByteArray())
        wanted = list
        // The pages, so every screen opens without the network.
        for (path in PAGES) {
            val page = fetch(ORIGIN + path, null, FILE_WAIT_MS) ?: continue
            if (page.status == 200 && page.type.startsWith("text/html")) save(File(pagesDir, pageName(path)), page.body)
        }
    }
}
