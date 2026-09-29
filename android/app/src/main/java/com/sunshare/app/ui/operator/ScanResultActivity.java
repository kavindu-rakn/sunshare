/*
 * ============================================================================
 *  File        : ScanResultActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M11 Scan result - after the operator scans a QR code, the
 *                text is checked with the server (POST
 *                /api/reservations/verify-qr). Valid -> the booking's
 *                prosumer, station, time and kWh with "Verified with server"
 *                and a Finalize button (PATCH /api/reservations/{id}/complete,
 *                which checks everything again and sets Completed). Invalid ->
 *                a red card with the API's reason. The phone never decides
 *                whether a QR is valid - the server does (R14).
 * ============================================================================
 */
package com.sunshare.app.ui.operator;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.api.models.VerifyQrRequest;
import com.sunshare.app.ui.prosumer.BookingAdapter;
import com.sunshare.app.ui.prosumer.ReservationSummaryActivity;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ScanResultActivity extends AppCompatActivity {

    // The text the camera read from the QR code is passed in the Intent under this name.
    public static final String EXTRA_QR_DATA = "qrData";

    private String qrData;
    // The booking the server verified (null until then); Finalize completes this one.
    private ReservationResponse verified;

    private View checking;
    private MaterialCardView cardResult;
    private TextView textResultIcon;
    private TextView textResultTitle;
    private TextView textReason;
    private View bookingDetails;
    private Button buttonFinalize;

    // Called when the screen opens: makes sure someone is logged in, reads the scanned text,
    // links the views and asks the server to check the code.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scan_result);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        if (SessionGuard.require(this) == null) {
            return;
        }
        toolbar.setNavigationOnClickListener(v -> finish());

        qrData = getIntent().getStringExtra(EXTRA_QR_DATA);
        checking = findViewById(R.id.checking);
        cardResult = findViewById(R.id.cardResult);
        textResultIcon = findViewById(R.id.textResultIcon);
        textResultTitle = findViewById(R.id.textResultTitle);
        textReason = findViewById(R.id.textReason);
        bookingDetails = findViewById(R.id.bookingDetails);
        buttonFinalize = findViewById(R.id.buttonFinalize);
        buttonFinalize.setOnClickListener(v -> confirmFinalize());
        findViewById(R.id.buttonBack).setOnClickListener(v -> finish());

        verify();
    }

    // POST /api/reservations/verify-qr - the server checks the format, that the booking exists,
    // is Approved and that the secret token matches (R14). Nothing is changed yet.
    private void verify() {
        checking.setVisibility(View.VISIBLE);
        ApiClient.get(this).verifyQr(new VerifyQrRequest(qrData == null ? "" : qrData)).enqueue(new Callback<ReservationResponse>() {
            // The API answered: valid -> show the booking; invalid -> show its reason.
            @Override
            public void onResponse(Call<ReservationResponse> call, Response<ReservationResponse> response) {
                checking.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    showVerified(response.body());
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ScanResultActivity.this);
                } else {
                    showInvalid(ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ReservationResponse> call, Throwable error) {
                checking.setVisibility(View.GONE);
                showInvalid(ApiErrorParser.fromFailure(ScanResultActivity.this));
            }
        });
    }

    // Green card: whose booking it is and what to transfer, plus the Finalize button.
    private void showVerified(ReservationResponse booking) {
        verified = booking;
        showResult("✓", "Verified with server", R.color.ss_success);
        textReason.setVisibility(View.GONE);
        ((TextView) findViewById(R.id.textProsumer)).setText(booking.prosumerName + " (" + booking.prosumerNic + ")");
        ((TextView) findViewById(R.id.textStation)).setText(booking.stationName);
        UiUtils.showStatusBadge(findViewById(R.id.textStatus), booking.status);
        ((TextView) findViewById(R.id.textTime)).setText(DateUtils.formatRange(booking.startTime, booking.endTime));
        ((TextView) findViewById(R.id.textEnergy)).setText(BookingAdapter.energyText(booking));
        ((TextView) findViewById(R.id.textBookingId)).setText("Booking ID " + booking.id);
        bookingDetails.setVisibility(View.VISIBLE);
        buttonFinalize.setVisibility(View.VISIBLE);
    }

    // Red card with the server's reason (not a SunShare code, already completed, cancelled, not approved ...).
    private void showInvalid(String reason) {
        verified = null;
        showResult("✕", "This QR code can't be used", R.color.ss_danger);
        textReason.setText(reason);
        textReason.setVisibility(View.VISIBLE);
        bookingDetails.setVisibility(View.GONE);
        buttonFinalize.setVisibility(View.GONE);
    }

    // Shows the result card with its icon, title and border colour.
    private void showResult(String icon, String title, int colorRes) {
        textResultIcon.setText(icon);
        textResultIcon.setBackgroundTintList(ContextCompat.getColorStateList(this, colorRes));
        textResultTitle.setText(title);
        cardResult.setStrokeColor(ContextCompat.getColor(this, colorRes));
        cardResult.setVisibility(View.VISIBLE);
    }

    // Asks "are you sure?" first - a completed booking can't be changed any more (R15).
    private void confirmFinalize() {
        if (verified == null) {
            return;
        }
        new MaterialAlertDialogBuilder(this)
                .setTitle("Finalize the energy transfer?")
                .setMessage(BookingAdapter.energyText(verified) + " for " + verified.prosumerName
                        + " at " + verified.stationName + " will be marked Completed. This can't be undone.")
                .setNegativeButton("Not yet", null)
                .setPositiveButton("Finalize", (dialog, which) -> finalizeTransfer())
                .show();
    }

    // PATCH /api/reservations/{id}/complete with the same QR text - the server checks everything again
    // (the booking could have changed since the scan), sets Completed + who/when, and the Summary opens.
    private void finalizeTransfer() {
        UiUtils.setLoading(buttonFinalize, true);
        ApiClient.get(this).completeReservation(verified.id, new VerifyQrRequest(qrData)).enqueue(new Callback<ReservationResponse>() {
            // The API answered: completed -> Summary (M7); otherwise its reason.
            @Override
            public void onResponse(Call<ReservationResponse> call, Response<ReservationResponse> response) {
                UiUtils.setLoading(buttonFinalize, false);
                if (response.isSuccessful() && response.body() != null) {
                    ReservationSummaryActivity.open(ScanResultActivity.this, response.body(), ReservationSummaryActivity.ACTION_COMPLETED);
                    finish();
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ScanResultActivity.this);
                } else {
                    showInvalid(ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ReservationResponse> call, Throwable error) {
                UiUtils.setLoading(buttonFinalize, false);
                UiUtils.toast(ScanResultActivity.this, ApiErrorParser.fromFailure(ScanResultActivity.this));
            }
        });
    }
}
