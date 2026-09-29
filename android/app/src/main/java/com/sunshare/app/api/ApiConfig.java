/*
 * ============================================================================
 *  File        : ApiConfig.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Where the SunShare API lives. Default is the emulator's
 *                address for the laptop (10.0.2.2) on the IIS port 8080; a
 *                real phone uses the laptop's Wi-Fi address, changed with the
 *                Server address setting and saved in SQLite (app_settings).
 * ============================================================================
 */
package com.sunshare.app.api;

import android.content.Context;

import com.sunshare.app.db.SunShareDbHelper;

import okhttp3.HttpUrl;

public final class ApiConfig {

    public static final String DEFAULT_BASE_URL = "http://10.0.2.2:8080/";
    private static final String SETTING_KEY = "api_base_url";

    // Only static helpers - nobody needs to create an ApiConfig object.
    private ApiConfig() {
    }

    // Returns the saved server address, or the emulator default when none was saved.
    public static String getBaseUrl(Context context) {
        String saved = SunShareDbHelper.get(context).getSetting(SETTING_KEY);
        return (saved == null || saved.isEmpty()) ? DEFAULT_BASE_URL : saved;
    }

    // Saves a new server address and makes the next API call use it.
    public static void setBaseUrl(Context context, String url) {
        SunShareDbHelper.get(context).saveSetting(SETTING_KEY, normalize(url));
        ApiClient.reset();
    }

    // True when the typed address can be used (e.g. "192.168.1.7:8080" or "http://192.168.1.7:8080/").
    public static boolean isValidBaseUrl(String url) {
        return url != null && !url.trim().isEmpty() && HttpUrl.parse(normalize(url)) != null;
    }

    // Adds "http://" if missing and a "/" at the end (Retrofit needs the ending slash).
    public static String normalize(String url) {
        String clean = url == null ? "" : url.trim();
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://" + clean;
        }
        if (!clean.endsWith("/")) {
            clean = clean + "/";
        }
        return clean;
    }
}
