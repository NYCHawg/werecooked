package com.summithouse.werecooked;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import java.io.File;
import java.util.ArrayList;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String HOME = "https://appassets.androidplatform.net/assets/index.html";
    private static final int LOC_REQ = 7;
    private static final int CAM_REQ = 8;
    private static final int FILE_REQ = 9;
    private static final int VOICE_REQ = 11;
    private static final int FILECAM_REQ = 12;
    private Uri cameraUri = null;
    private boolean pendingCapture = false, pendingImages = true;
    private PermissionRequest pendingCam;
    private ValueCallback<Uri[]> fileCallback;
    private WebView web;
    private boolean loaded = false;
    private String pendingAuth = null;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#1F4D38"));

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSaveFormData(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        if (android.os.Build.VERSION.SDK_INT >= 26) web.setImportantForAutofill(android.view.View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                openExternal(u.toString());
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                loaded = true;
                if (pendingAuth != null) { deliverAuth(pendingAuth); pendingAuth = null; }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // Camera for the barcode scanner and pantry photos
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsCam = false;
                    for (String r : request.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCam = true;
                    if (!wantsCam) { request.deny(); return; }
                    if (Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else {
                        pendingCam = request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, CAM_REQ);
                    }
                });
            }

            // "Choose from photos"
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    String[] accept = params.getAcceptTypes();
                    String joined = accept == null ? "" : String.join(",", accept);
                    boolean images = joined.isEmpty() || joined.contains("image");
                    boolean capture = params.isCaptureEnabled();
                    if (images && Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                        pendingCapture = capture; pendingImages = true;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, FILECAM_REQ);
                    } else {
                        launchChooser(images, capture, true);
                    }
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                } else {
                    geoCallback = callback; geoOrigin = origin;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, LOC_REQ);
                }
            }
        });
        setContentView(web);

        handleIntent(getIntent());
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(HOME);
    }

    /** Photos: the phone's real camera (full resolution) and/or the gallery. Other files: the file picker. */
    private void launchChooser(boolean images, boolean capture, boolean camAllowed) {
        try {
            Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
            pick.addCategory(Intent.CATEGORY_OPENABLE);
            if (!images) {
                pick.setType("*/*");
                pick.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/csv", "text/comma-separated-values", "text/plain", "application/csv", "application/vnd.ms-excel", "application/octet-stream"});
                startActivityForResult(Intent.createChooser(pick, "Choose a CSV file"), FILE_REQ);
                return;
            }
            pick.setType("image/*");
            Intent cam = null;
            cameraUri = null;
            if (camAllowed) {
                try {
                    File dir = new File(getCacheDir(), "shots"); dir.mkdirs();
                    File f = new File(dir, "shot-" + System.currentTimeMillis() + ".jpg");
                    cameraUri = FileProvider.getUriForFile(this, getPackageName() + ".files", f);
                    cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                    cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } catch (Exception e) { cam = null; cameraUri = null; }
            }
            if (capture && cam != null) { startActivityForResult(cam, FILE_REQ); return; }
            Intent chooser = Intent.createChooser(pick, "Add a photo");
            if (cam != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
            startActivityForResult(chooser, FILE_REQ);
        } catch (Exception e) {
            if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == VOICE_REQ) {
            String text = null;
            if (result == RESULT_OK && data != null) {
                ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (r != null && !r.isEmpty()) text = r.get(0);
            }
            final String js = "window.__voiceResult && window.__voiceResult(" + (text == null ? "null" : JSONObject.quote(text)) + ")";
            web.post(() -> web.evaluateJavascript(js, null));
            return;
        }
        if (code == FILE_REQ && fileCallback != null) {
            Uri[] out = null;
            if (result == RESULT_OK) {
                if (data != null && data.getData() != null) out = new Uri[]{data.getData()};
                else if (cameraUri != null) out = new Uri[]{cameraUri};
            }
            cameraUri = null;
            fileCallback.onReceiveValue(out);
            fileCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code == CAM_REQ && pendingCam != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED)
                pendingCam.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else pendingCam.deny();
            pendingCam = null;
            return;
        }
        if (code == FILECAM_REQ) {
            boolean ok = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
            launchChooser(pendingImages, pendingCapture, ok);
            return;
        }
        if (code == LOC_REQ && geoCallback != null) {
            boolean ok = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
            geoCallback.invoke(geoOrigin, ok, false);
            geoCallback = null;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    // Google sign-in returns here as werecooked://auth-callback?code=...
    private void handleIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return;
        Uri u = intent.getData();
        if (!"werecooked".equals(u.getScheme())) return;
        if (loaded) deliverAuth(u.toString()); else pendingAuth = u.toString();
    }

    private void deliverAuth(String url) {
        web.evaluateJavascript("window.__authCallback && window.__authCallback(" + JSONObject.quote(url) + ")", null);
    }

    private void openExternal(String url) {
        try {
            Uri u = Uri.parse(url);
            String sch = u.getScheme();
            if (!"https".equals(sch) && !"http".equals(sch) && !"geo".equals(sch)) return;
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (Exception ignored) { }
    }

    private class Bridge {
        @JavascriptInterface
        public boolean canVoice() {
            return new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).resolveActivity(getPackageManager()) != null;
        }
        @JavascriptInterface
        public void startVoice(final String prompt) {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    i.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt == null || prompt.isEmpty() ? "Describe your recipe" : prompt);
                    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L);
                    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L);
                    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 15000L);
                    startActivityForResult(i, VOICE_REQ);
                } catch (Exception e) {
                    web.evaluateJavascript("window.__voiceResult && window.__voiceResult(null, 'unavailable')", null);
                }
            });
        }
        @JavascriptInterface
        public void openExternal(final String url) {
            runOnUiThread(() -> MainActivity.this.openExternal(url));
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.__back ? window.__back() : false", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }
}
