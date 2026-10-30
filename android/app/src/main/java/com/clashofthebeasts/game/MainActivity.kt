package com.clashofthebeasts.game

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

/**
 * The game as an Android app (chủ game 30/10): one full screen page of the live site, its files kept on the phone
 * ([WebStore]), the system bars hidden like a game (a swipe from the edge shows them for a moment), so there is none of
 * Chrome's "swipe to exit full screen" notice.
 */
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var store: WebStore

    /**
     * Leaving the app stops the music and sounds, and coming back plays them again: the page keeps playing in the
     * background otherwise. Every sound the page starts goes through these, so the app can pause them all.
     */
    private val audioHooks = """
        (function () {
          if (window.__clashApp) return;
          window.__clashApp = true;
          var media = new Set(), rooms = new Set(), held = [], away = false;
          var play = HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play = function () {
            media.add(this);
            if (away) { held.push(this); return Promise.resolve(); }
            return play.apply(this, arguments);
          };
          var Room = window.AudioContext || window.webkitAudioContext;
          if (Room) {
            var Kept = class extends Room { constructor(a) { super(a); rooms.add(this); } };
            window.AudioContext = Kept;
            window.webkitAudioContext = Kept;
          }
          window.__clashAway = function () {
            away = true;
            media.forEach(function (m) { if (!m.paused) { held.push(m); m.pause(); } });
            rooms.forEach(function (r) { if (r.state === "running") { r.__held = true; r.suspend(); } });
          };
          window.__clashBack = function () {
            away = false;
            var list = held; held = [];
            list.forEach(function (m) { play.call(m).catch(function () {}); });
            rooms.forEach(function (r) { if (r.__held) { r.__held = false; r.resume(); } });
          };
        })();
    """.trimIndent()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = WebStore(applicationContext)
        hideBars()

        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#071018"))
        web.overScrollMode = View.OVER_SCROLL_NEVER
        web.isVerticalScrollBarEnabled = false
        web.isHorizontalScrollBarEnabled = false
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            @Suppress("DEPRECATION")
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            // The phone's font size setting would break the card layout.
            textZoom = 100
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = false
            useWideViewPort = true
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString ClashOfTheBeastsApp/${BuildConfig.VERSION_NAME}"
        }
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)

        val hooked = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)
        if (hooked) WebViewCompat.addDocumentStartJavaScript(web, audioHooks, setOf(WebStore.ORIGIN))

        web.webChromeClient = WebChromeClient()
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                try {
                    store.intercept(request)
                } catch (_: Exception) {
                    null
                }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.host == WebStore.HOST) return false
                // Links out of the game open in the browser.
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                } catch (_: Exception) {
                    // Nothing can open it.
                }
                return true
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                if (!hooked) view.evaluateJavascript(audioHooks, null)
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val path = Uri.parse(web.url ?: "/").path ?: "/"
                // On the main menu Back closes the game; elsewhere it goes back a page.
                if (path != "/" && web.canGoBack()) web.goBack() else finish()
            }
        })

        setContentView(web)
        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("${WebStore.ORIGIN}/")
        store.sync()
    }

    private fun hideBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        // Draw under the camera cutout too, or Android leaves a black bar at the top of the screen.
        if (android.os.Build.VERSION.SDK_INT >= 28) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode = if (android.os.Build.VERSION.SDK_INT >= 30)
                    android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                else
                    android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        val bars = WindowInsetsControllerCompat(window, window.decorView)
        bars.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        bars.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideBars()
    }

    private var shown = false

    override fun onResume() {
        super.onResume()
        shown = true
        hideBars()
        web.onResume()
        web.resumeTimers()
        web.evaluateJavascript("window.__clashBack && window.__clashBack()", null)
    }

    override fun onPause() {
        shown = false
        // The page stops its sounds first, then rests until the game comes back.
        web.evaluateJavascript("window.__clashAway && window.__clashAway()") {
            if (!shown) {
                web.onPause()
                web.pauseTimers()
            }
        }
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }
}
