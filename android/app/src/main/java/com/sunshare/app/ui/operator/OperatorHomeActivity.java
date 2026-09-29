/*
 * ============================================================================
 *  File        : OperatorHomeActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M10 Operator Home - the first screen after a Grid Operator
 *                logs in: greeting, today's counts (Today, Pending, Approved
 *                upcoming) worked out by the API (GET /api/dashboard/summary),
 *                refreshed every time the screen comes back, and a big
 *                Scan QR button that opens the ZXing camera scanner. The
 *                scanned text goes to the Scan Result screen (M11). (The Nearby
 *                stations button was added with M5, Part B.)
 * ============================================================================
 */
package com.sunshare.app.ui.operator;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.appcompat.app.AppCompatActivity;

import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanIntentResult;
import com.journeyapps.barcodescanner.ScanOptions;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.StaffDashboardResponse;
import com.sunshare.app.db.Session;
import com.sunshare.app.ui.map.StationMapActivity;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class OperatorHomeActivity extends AppCompatActivity {

    private TextView textTodayCount;
    private TextView textPendingCount;
    private TextView textApprovedCount;
    private TextView textError;

    // Opens ZXing's camera scanner and receives what it read. It has to be registered when the screen
    // is created; ZXing asks for the camera permission itself the first time.
    // Reference: ZXing Android Embedded - Usage with ScanContract https://github.com/journeyapps/zxing-android-embedded
    private final ActivityResultLauncher<ScanOptions> scanLauncher =
            registerForActivityResult(new ScanContract(), this::onScanned);

    // Called when the screen opens: keeps it clear of the phone's bars, makes sure someone is
    // logged in (else back to Login), shows the greeting and links the buttons.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_home);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), findViewById(R.id.header));
        Session session = SessionGuard.require(this);
        if (session == null) {
            return;
        }

        TextView textGreeting = findViewById(R.id.textGreeting);
        TextView textRole = findViewById(R.id.textRole);
        textGreeting.setText("Hello, " + firstName(session.fullName));
        textRole.setText("Grid Operator · NIC " + session.nic);
        textTodayCount = findViewById(R.id.textTodayCount);
        textPendingCount = findViewById(R.id.textPendingCount);
        textApprovedCount = findViewById(R.id.textApprovedCount);
        textError = findViewById(R.id.textError);

        findViewById(R.id.buttonScan).setOnClickListener(v -> startScan());
        findViewById(R.id.buttonMap).setOnClickListener(v -> startActivity(new Intent(this, StationMapActivity.class)));
        findViewById(R.id.buttonLogout).setOnClickListener(v -> SessionGuard.logout(this));
    }

    // Called every time the screen comes to the front (also after finishing a transfer): reloads the counts.
    @Override
    protected void onResume() {
        super.onResume();
        if (textTodayCount != null) {
            loadDashboard();
        }
    }

    // GET /api/dashboard/summary - the same numbers the web dashboard shows (docs/01-SPEC.md section 5).
    private void loadDashboard() {
        UiUtils.hideMessage(textError);
        ApiClient.get(this).getStaffDashboard().enqueue(new Callback<StaffDashboardResponse>() {
            // The API answered: show the numbers, or the reason it failed.
            @Override
            public void onResponse(Call<StaffDashboardResponse> call, Response<StaffDashboardResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    StaffDashboardResponse dashboard = response.body();
                    textTodayCount.setText(String.valueOf(dashboard.todayReservations));
                    textPendingCount.setText(String.valueOf(dashboard.pendingReservations));
                    textApprovedCount.setText(String.valueOf(dashboard.approvedFutureReservations));
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(OperatorHomeActivity.this);
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<StaffDashboardResponse> call, Throwable error) {
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(OperatorHomeActivity.this));
            }
        });
    }

    // Opens the camera scanner (our QrScanActivity = ZXing's screen kept clear of the phone's bars),
    // set to read QR codes only, with a hint on screen.
    private void startScan() {
        ScanOptions options = new ScanOptions();
        options.setDesiredBarcodeFormats(ScanOptions.QR_CODE);
        options.setPrompt("Point the camera at the prosumer's QR code");
        options.setBeepEnabled(false);
        options.setOrientationLocked(false);
        options.setCaptureActivity(QrScanActivity.class);
        scanLauncher.launch(options);
    }

    // The scanner closed: no text = the operator pressed Back; otherwise check the text with the server (M11).
    private void onScanned(ScanIntentResult result) {
        if (result.getContents() == null) {
            UiUtils.toast(this, "Scan cancelled.");
            return;
        }
        Intent intent = new Intent(this, ScanResultActivity.class);
        intent.putExtra(ScanResultActivity.EXTRA_QR_DATA, result.getContents());
        startActivity(intent);
    }

    // "Kasun Silva" -> "Kasun" (a friendlier greeting).
    private String firstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "there";
        }
        return fullName.trim().split("\\s+")[0];
    }
}
