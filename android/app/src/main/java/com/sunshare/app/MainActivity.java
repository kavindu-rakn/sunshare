/*
 * ============================================================================
 *  File        : MainActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Temporary start screen (Phase 13). It calls GET /api/health
 *                through Retrofit to prove the phone reaches the API on IIS
 *                and the API reaches MongoDB. The Login screen (M1) replaces
 *                it as the first screen in Phase 14.
 * ============================================================================
 */
package com.sunshare.app;

import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiConfig;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.HealthResponse;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private TextView textStatus;
    private TextView textServerTime;
    private TextView textServerUrl;
    private Button buttonCheck;

    // Called when the screen opens: loads the layout, pads it away from the phone's bars,
    // links the views, and runs the first server check.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        // When Android reports the size of the status/navigation bars, use it as padding.
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        textStatus = findViewById(R.id.textStatus);
        textServerTime = findViewById(R.id.textServerTime);
        textServerUrl = findViewById(R.id.textServerUrl);
        buttonCheck = findViewById(R.id.buttonCheck);
        buttonCheck.setOnClickListener(v -> checkServer());

        checkServer();
    }

    // Calls GET /api/health in the background; Retrofit runs onResponse/onFailure back on the screen's thread.
    private void checkServer() {
        textServerUrl.setText("Server: " + ApiConfig.getBaseUrl(this));
        textServerTime.setText("");
        showStatus(getString(R.string.checking_server), R.color.ss_text);
        UiUtils.setLoading(buttonCheck, true);

        ApiClient.get(this).health().enqueue(new Callback<HealthResponse>() {
            // The API answered: 200 = all good, 503 = API up but MongoDB down.
            @Override
            public void onResponse(Call<HealthResponse> call, Response<HealthResponse> response) {
                UiUtils.setLoading(buttonCheck, false);
                HealthResponse health = response.body();
                if (response.isSuccessful() && health != null) {
                    showStatus("API: " + health.api + " · Database: " + health.database, R.color.ss_success);
                    textServerTime.setText("Server time: " + DateUtils.formatDateTime(health.time));
                } else if (response.code() == 503) {
                    showStatus("API: ok · Database: unreachable (is the MongoDB service running?)", R.color.ss_danger);
                } else {
                    showStatus(ApiErrorParser.fromResponse(response), R.color.ss_danger);
                }
            }

            // The call never reached the API (IIS stopped, wrong address, no network).
            @Override
            public void onFailure(Call<HealthResponse> call, Throwable error) {
                UiUtils.setLoading(buttonCheck, false);
                showStatus(ApiErrorParser.fromFailure(MainActivity.this), R.color.ss_danger);
            }
        });
    }

    // Shows a status line in the given colour (green = connected, red = problem).
    private void showStatus(String message, int colorRes) {
        textStatus.setText(message);
        textStatus.setTextColor(ContextCompat.getColor(this, colorRes));
    }
}
