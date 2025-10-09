package com.dynamit.arif;

import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.WindowManager;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.content.pm.ActivityInfo;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;

// Import Capacitor plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;
import com.capacitorjs.plugins.filesystem.FilesystemPlugin;
import com.capacitorjs.plugins.camera.CameraPlugin;
import com.capacitorjs.plugins.preferences.PreferencesPlugin;
import com.capacitorjs.plugins.network.NetworkPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.capacitorjs.plugins.browser.BrowserPlugin;
import com.capacitorjs.plugins.splashscreen.SplashScreenPlugin;
import com.capacitorjs.plugins.statusbar.StatusBarPlugin;

public class MainActivity extends BridgeActivity {
    private static final int STORAGE_PERMISSION_REQUEST_CODE = 1001;
    private static final int MANAGE_STORAGE_REQUEST_CODE = 1002;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(LocalNotificationsPlugin.class);
        registerPlugin(FilesystemPlugin.class);
        registerPlugin(CameraPlugin.class);
        registerPlugin(PreferencesPlugin.class);
        registerPlugin(NetworkPlugin.class);
        registerPlugin(AppPlugin.class);
        registerPlugin(BrowserPlugin.class);
        registerPlugin(SplashScreenPlugin.class);
        registerPlugin(StatusBarPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // Request storage permissions
        requestStoragePermissions();
        
        // Prevent memory leaks by setting orientation
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        
        // Enable edge-to-edge display for notch devices
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Window window = getWindow();
            WindowManager.LayoutParams layoutParams = window.getAttributes();
            layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(layoutParams);
        }
        
        // Set status bar with light background and dark icons
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            // Use white/light status bar background
            window.setStatusBarColor(android.graphics.Color.parseColor("#FAFAFF"));
            
            // Set dark icons on status bar (Android 6.0+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                View decorView = window.getDecorView();
                decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            }
        }
        
        // Configure WebView immediately but safely
        configureWebViewSafely();
    }
    
    private void configureWebViewSafely() {
        // Try multiple times to ensure WebView is configured
        new android.os.Handler().post(new Runnable() {
            @Override
            public void run() {
                if (!configureWebView()) {
                    // Retry after 100ms if failed
                    new android.os.Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            if (!configureWebView()) {
                                // Final retry after 500ms
                                new android.os.Handler().postDelayed(new Runnable() {
                                    @Override
                                    public void run() {
                                        configureWebView();
                                    }
                                }, 500);
                            }
                        }
                    }, 100);
                }
            }
        });
    }

    private boolean configureWebView() {
        try {
            // Get the WebView from Capacitor Bridge
            Bridge bridge = getBridge();
            if (bridge != null) {
                WebView webView = bridge.getWebView();
                if (webView != null) {
                    WebSettings webSettings = webView.getSettings();
                    
                    // Critical settings for remote server loading
                    webSettings.setJavaScriptEnabled(true);
                    webSettings.setDomStorageEnabled(true);
                    webSettings.setDatabaseEnabled(true);
                    webSettings.setLoadWithOverviewMode(true);
                    webSettings.setUseWideViewPort(true);
                    
                    // Memory and performance optimizations
                    webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                    
                    // Performance settings
                    webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                    webSettings.setEnableSmoothTransition(true);
                    webSettings.setBuiltInZoomControls(false);
                    webSettings.setDisplayZoomControls(false);
                    
                    // Network and security settings
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
                    }
                    
                    // Enable hardware acceleration
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                    }
                    
                    // Set user agent for better server compatibility
                    String userAgent = webSettings.getUserAgentString();
                    webSettings.setUserAgentString(userAgent + " dynamIT-App/1.0");
                    
                    // Enhanced WebViewClient for better error handling
                    webView.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                            super.onPageStarted(view, url, favicon);
                            android.util.Log.d("WebView", "Started loading: " + url);
                        }
                        
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                            android.util.Log.d("WebView", "Finished loading: " + url);
                        }
                        
                        @Override
                        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                            super.onReceivedError(view, errorCode, description, failingUrl);
                            android.util.Log.e("WebView", "Error loading " + failingUrl + ": " + description);
                            
                            // Handle specific error codes
                            if (errorCode == ERROR_TIMEOUT || errorCode == ERROR_HOST_LOOKUP) {
                                // Retry loading after a delay
                                new android.os.Handler().postDelayed(new Runnable() {
                                    @Override
                                    public void run() {
                                        view.reload();
                                    }
                                }, 3000);
                            }
                        }
                        
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            // Handle navigation to other PWA domains
                            if (url.contains("no-due-generator-app.vercel.app") || 
                                url.contains("dynamit-learn.vercel.app") ||
                                url.contains("it-panel-beta.vercel.app")) {
                                return false; // Let WebView handle it
                            }
                            return super.shouldOverrideUrlLoading(view, url);
                        }
                    });
                    
                    // Enhanced WebChromeClient for better performance
                    webView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onProgressChanged(WebView view, int newProgress) {
                            super.onProgressChanged(view, newProgress);
                            android.util.Log.d("WebView", "Loading progress: " + newProgress + "%");
                        }
                    });
                    
                    android.util.Log.d("WebView", "WebView configured successfully");
                    return true;
                } else {
                    android.util.Log.w("WebView", "WebView is null");
                    return false;
                }
            } else {
                android.util.Log.w("WebView", "Bridge is null");
                return false;
            }
        } catch (Exception e) {
            android.util.Log.e("WebView", "Error configuring WebView: " + e.getMessage());
            return false;
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Ensure WebView is properly loaded on resume
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().onResume();
            bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Properly pause WebView to prevent memory leaks
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().onPause();
            bridge.getWebView().pauseTimers();
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        // Clean up WebView to prevent memory leaks
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().clearCache(true);
            bridge.getWebView().clearHistory();
            bridge.getWebView().removeAllViews();
            bridge.getWebView().destroy();
        }
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Handle Android back button properly
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            Bridge bridge = getBridge();
            if (bridge != null && bridge.getWebView() != null) {
                WebView webView = bridge.getWebView();
                if (webView.canGoBack()) {
                    webView.goBack();
                    return true;
                }
            }
        }
        return super.onKeyDown(keyCode, event);
    }
    
    @Override
    public void onLowMemory() {
        super.onLowMemory();
        // Handle low memory situations
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().freeMemory();
            bridge.getWebView().clearCache(false);
        }
        System.gc(); // Suggest garbage collection
    }
    
    private void requestStoragePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ - Request MANAGE_EXTERNAL_STORAGE
            if (!Environment.isExternalStorageManager()) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivityForResult(intent, MANAGE_STORAGE_REQUEST_CODE);
                } catch (Exception e) {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    startActivityForResult(intent, MANAGE_STORAGE_REQUEST_CODE);
                }
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Android 6-10 - Request READ/WRITE_EXTERNAL_STORAGE
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) 
                != PackageManager.PERMISSION_GRANTED) {
                
                ActivityCompat.requestPermissions(this,
                    new String[]{
                        Manifest.permission.WRITE_EXTERNAL_STORAGE,
                        Manifest.permission.READ_EXTERNAL_STORAGE
                    },
                    STORAGE_PERMISSION_REQUEST_CODE);
            }
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == STORAGE_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                android.util.Log.d("Permissions", "Storage permissions granted");
            } else {
                android.util.Log.w("Permissions", "Storage permissions denied");
            }
        }
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == MANAGE_STORAGE_REQUEST_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                if (Environment.isExternalStorageManager()) {
                    android.util.Log.d("Permissions", "MANAGE_EXTERNAL_STORAGE permission granted");
                } else {
                    android.util.Log.w("Permissions", "MANAGE_EXTERNAL_STORAGE permission denied");
                }
            }
        }
    }
}
