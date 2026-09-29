/*
 * ============================================================================
 *  File        : StationMapActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Stations, slots & map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : M5 Nearby stations - for prosumers and Grid Operators.
 *                1) asks for the location permission and gets the phone's
 *                   location (Fused Location); if it can't, uses SLIIT Malabe,
 *                2) GET /api/stations/nearby?lat=&lng=&radiusKm=25 - the API
 *                   works out the distances and sorts nearest first (R18),
 *                3) saves the stations in the SQLite stations_cache table,
 *                4) shows them on a Google map: assets/map.html (Maps
 *                   JavaScript API) inside a WebView, with the demo key and
 *                   the data filled in (D53).
 *                If the API can't be reached, the saved stations are shown
 *                instead (offline fallback).
 * ============================================================================
 */
package com.sunshare.app.ui.map;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.CurrentLocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.gson.Gson;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.StationResponse;
import com.sunshare.app.db.SunShareDbHelper;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StationMapActivity extends AppCompatActivity {

    // How far to look for stations, in km (the API's default too).
    private static final double RADIUS_KM = 25;
    // Where to search when the phone's location can't be used: the SLIIT Malabe campus.
    private static final double DEFAULT_LAT = 6.9147;
    private static final double DEFAULT_LNG = 79.9729;
    // The page is loaded "as if" from this address; Google needs a normal https origin for the map.
    private static final String PAGE_BASE_URL = "https://sunshare.local/";
    // Wait at most this long for the phone's position before using SLIIT Malabe instead.
    private static final long LOCATION_TIMEOUT_MS = 10_000;

    private FrameLayout mapContainer;
    private WebView webMap;
    private TextView textStatus;
    private ProgressBar progress;
    // Extra words for the status line when the default location is used (null = real location).
    private String locationNote;

    // Shows Android's "Allow SunShare to access this device's location?" box and receives the answer.
    private final ActivityResultLauncher<String[]> permissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(), this::onPermissionResult);

    // Called when the screen opens: makes sure someone is logged in, links the views
    // and starts with the location. (The WebView is only made in showMap - see there.)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_station_map);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        if (SessionGuard.require(this) == null) {
            return;
        }
        toolbar.setNavigationOnClickListener(v -> finish());

        mapContainer = findViewById(R.id.mapContainer);
        textStatus = findViewById(R.id.textStatus);
        progress = findViewById(R.id.progress);
        askForLocation();
    }

    // Frees the WebView's memory when the screen closes.
    @Override
    protected void onDestroy() {
        if (webMap != null) {
            webMap.destroy();
        }
        super.onDestroy();
    }

    // The map page needs JavaScript. A tap on "Directions in Google Maps" opens the Google Maps app
    // instead of loading Google's website inside our small map view.
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webMap.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        webMap.setWebViewClient(new WebViewClient() {
            // Decides where a tapped link opens: Google Maps links go to the Google Maps app (or a browser).
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("https://www.google.com/maps")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()));
                    } catch (ActivityNotFoundException noApp) {
                        UiUtils.toast(StationMapActivity.this, "No app on this phone can open Google Maps directions.");
                    }
                    return true;
                }
                return false;
            }
        });
    }

    // Uses the location straight away if allowed before; otherwise asks for it first.
    private void askForLocation() {
        boolean allowed = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        if (allowed) {
            findLocation();
        } else {
            permissionLauncher.launch(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION});
        }
    }

    // The user answered the permission box: precise or approximate location is fine; "Don't allow" -> SLIIT Malabe.
    private void onPermissionResult(Map<String, Boolean> answers) {
        if (answers.containsValue(true)) {
            findLocation();
        } else {
            useDefaultLocation("Location is off, so stations near SLIIT Malabe are shown.");
        }
    }

    // Asks Fused Location (Google Play services) for one position of the phone: GPS, Wi-Fi or mobile
    // network, a fix up to 1 minute old is fine, and after 10 seconds without one it gives up (null).
    // Reference: Google, "Get the last known location" / getCurrentLocation https://developer.android.com/develop/sensors-and-location/location/retrieve-current
    @SuppressLint("MissingPermission")
    private void findLocation() {
        setStatus(getString(R.string.map_finding_location), true);
        CurrentLocationRequest request = new CurrentLocationRequest.Builder()
                .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                .setMaxUpdateAgeMillis(60_000)
                .setDurationMillis(LOCATION_TIMEOUT_MS)
                .build();
        LocationServices.getFusedLocationProviderClient(this)
                .getCurrentLocation(request, null)
                .addOnSuccessListener(this, location -> {
                    if (location == null) {
                        useDefaultLocation("Your location isn't available right now, so stations near SLIIT Malabe are shown.");
                    } else {
                        locationNote = null;
                        loadNearby(location.getLatitude(), location.getLongitude());
                    }
                })
                .addOnFailureListener(this, error ->
                        useDefaultLocation("Your location isn't available right now, so stations near SLIIT Malabe are shown."));
    }

    // Searches around the SLIIT Malabe campus instead, and says why on the status line.
    private void useDefaultLocation(String why) {
        locationNote = why;
        loadNearby(DEFAULT_LAT, DEFAULT_LNG);
    }

    // GET /api/stations/nearby - the API keeps active stations within the radius, works out each distance
    // and sorts nearest first (R18). The answer is saved in SQLite for offline use.
    private void loadNearby(double lat, double lng) {
        setStatus(getString(R.string.map_loading_stations), true);
        ApiClient.get(this).getNearbyStations(lat, lng, RADIUS_KM).enqueue(new Callback<List<StationResponse>>() {
            // The API answered: save + draw the stations, or fall back to the saved ones.
            @Override
            public void onResponse(Call<List<StationResponse>> call, Response<List<StationResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<StationResponse> stations = response.body();
                    SunShareDbHelper.get(StationMapActivity.this).cacheStations(stations);
                    showMap(lat, lng, stations);
                    setStatus(withNote(countText(stations.size())), false);
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(StationMapActivity.this);
                } else {
                    showSavedStations(lat, lng, ApiErrorParser.fromResponse(response));
                }
            }

            // The server can't be reached: use the stations saved last time.
            @Override
            public void onFailure(Call<List<StationResponse>> call, Throwable error) {
                showSavedStations(lat, lng, "Can't reach the SunShare server");
            }
        });
    }

    // Offline fallback: the stations from the SQLite stations_cache table, with the time they were saved.
    private void showSavedStations(double lat, double lng, String reason) {
        SunShareDbHelper db = SunShareDbHelper.get(this);
        List<StationResponse> saved = db.getCachedStations();
        if (saved.isEmpty()) {
            setStatus(reason + ", and no stations have been saved on this phone yet.", false);
            return;
        }
        showMap(lat, lng, saved);
        setStatus("Offline: showing " + saved.size() + " saved stations (saved "
                + DateUtils.formatDateTime(db.getStationsCachedAt()) + ").", false);
    }

    // Fills the key and the data into assets/map.html and shows it. Gson turns the data into JSON,
    // and escapes characters like < and > so the text can't break the page.
    // The WebView is made here, not in the layout: the first WebView in an app loads Chrome's engine,
    // which can take a few seconds on a slow phone, so the screen and the permission box come first.
    private void showMap(double lat, double lng, List<StationResponse> stations) {
        if (webMap == null) {
            webMap = new WebView(this);
            setupWebView();
            mapContainer.addView(webMap, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        }
        MapData data = new MapData();
        data.me = new MapData.Point(lat, lng);
        data.stations = stations;
        String html = readAsset("map.html")
                .replace("__MAPS_API_KEY__", mapsKey())
                .replace("__DATA__", new Gson().toJson(data));
        webMap.loadDataWithBaseURL(PAGE_BASE_URL, html, "text/html", "UTF-8", null);
    }

    // "3 stations within 25 km, nearest first." (or none).
    private String countText(int count) {
        if (count == 0) {
            return "No active stations within 25 km.";
        }
        return count + (count == 1 ? " station" : " stations") + " within 25 km, nearest first. Tap a marker for details.";
    }

    // Adds the "location is off" note in front of the status text when the default location was used.
    private String withNote(String text) {
        return locationNote == null ? text : locationNote + " " + text;
    }

    // Shows a line of text above the map, with the small spinner while something is loading.
    private void setStatus(String text, boolean loading) {
        textStatus.setText(text);
        progress.setVisibility(loading ? View.VISIBLE : View.GONE);
    }

    // The Google Maps key: put into the manifest at build time from local.properties (never in Git).
    private String mapsKey() {
        try {
            ApplicationInfo info = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
            String key = info.metaData == null ? null : info.metaData.getString("com.sunshare.app.MAPS_API_KEY");
            return key == null ? "" : key;
        } catch (PackageManager.NameNotFoundException e) {
            return "";
        }
    }

    // Reads a file from the app's assets folder as text.
    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            return "<p>The map page could not be opened.</p>";
        }
    }

    // The data handed to the map page: my position and the stations (Gson turns it into JSON).
    private static class MapData {
        Point me;
        List<StationResponse> stations;

        // A latitude / longitude pair.
        static class Point {
            final double lat;
            final double lng;

            // Makes a point from a latitude and longitude.
            Point(double lat, double lng) {
                this.lat = lat;
                this.lng = lng;
            }
        }
    }
}
