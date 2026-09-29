/*
 * ============================================================================
 *  File        : ProsumerHomeActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M3 Prosumer Home - the first screen after a prosumer logs
 *                in: greeting, count cards (Pending, Approved upcoming,
 *                Completed) and the next booking, all worked out by the API
 *                (GET /api/dashboard/prosumer, docs/01-SPEC.md section 5),
 *                refreshed every time the screen comes back. Tapping a count
 *                opens that list (M8); the next booking opens its details
 *                (M9). (The My profile button was added with M4 Profile,
 *                Part A.)
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.ProsumerDashboardResponse;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.db.Session;
import com.sunshare.app.db.SunShareDbHelper;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProsumerHomeActivity extends AppCompatActivity {

    private TextView textGreeting;
    private TextView textRole;
    private TextView textPendingCount;
    private TextView textApprovedCount;
    private TextView textCompletedCount;
    private View nextDetails;
    private TextView textNextStation;
    private TextView textNextStatus;
    private TextView textNextTime;
    private TextView textNextEnergy;
    private TextView textNoNext;
    private TextView textError;
    // The next booking from the last load (null if there is none), opened when its card is tapped.
    private ReservationResponse nextBooking;

    // Called when the screen opens: keeps it clear of the phone's bars, makes sure someone
    // is logged in (else back to Login), and links the cards and buttons.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_prosumer_home);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), findViewById(R.id.header));
        if (SessionGuard.require(this) == null) {
            return;
        }

        textGreeting = findViewById(R.id.textGreeting);
        textRole = findViewById(R.id.textRole);
        textPendingCount = findViewById(R.id.textPendingCount);
        textApprovedCount = findViewById(R.id.textApprovedCount);
        textCompletedCount = findViewById(R.id.textCompletedCount);
        nextDetails = findViewById(R.id.nextDetails);
        textNextStation = findViewById(R.id.textNextStation);
        textNextStatus = findViewById(R.id.textNextStatus);
        textNextTime = findViewById(R.id.textNextTime);
        textNextEnergy = findViewById(R.id.textNextEnergy);
        textNoNext = findViewById(R.id.textNoNext);
        textError = findViewById(R.id.textError);

        // Each count card opens the matching tab of My bookings.
        findViewById(R.id.cardPending).setOnClickListener(v -> openBookings("pending"));
        findViewById(R.id.cardApproved).setOnClickListener(v -> openBookings("current"));
        findViewById(R.id.cardCompleted).setOnClickListener(v -> openBookings("history"));
        findViewById(R.id.cardNext).setOnClickListener(v -> openNextBooking());
        findViewById(R.id.buttonBookings).setOnClickListener(v -> openBookings("current"));
        findViewById(R.id.buttonLogout).setOnClickListener(v -> SessionGuard.logout(this));
        findViewById(R.id.buttonProfile).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }

    // Called every time the screen comes to the front (also after returning from Profile or a booking):
    // shows the greeting from the saved session and reloads the counts.
    @Override
    protected void onResume() {
        super.onResume();
        Session session = SunShareDbHelper.get(this).getSession();
        if (session == null || textGreeting == null) {
            return;
        }
        textGreeting.setText("Hello, " + firstName(session.fullName));
        textRole.setText("Prosumer · NIC " + session.nic);
        loadDashboard();
    }

    // GET /api/dashboard/prosumer - the API counts only this prosumer's bookings (NIC from the token, R16).
    private void loadDashboard() {
        UiUtils.hideMessage(textError);
        ApiClient.get(this).getProsumerDashboard().enqueue(new Callback<ProsumerDashboardResponse>() {
            // The API answered: show the numbers, or the reason it failed.
            @Override
            public void onResponse(Call<ProsumerDashboardResponse> call, Response<ProsumerDashboardResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    showDashboard(response.body());
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ProsumerHomeActivity.this);
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ProsumerDashboardResponse> call, Throwable error) {
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ProsumerHomeActivity.this));
            }
        });
    }

    // Puts the three counts and the next booking on the screen.
    private void showDashboard(ProsumerDashboardResponse dashboard) {
        textPendingCount.setText(String.valueOf(dashboard.pendingCount));
        textApprovedCount.setText(String.valueOf(dashboard.approvedFutureCount));
        textCompletedCount.setText(String.valueOf(dashboard.completedCount));

        nextBooking = dashboard.nextReservation;
        if (nextBooking == null) {
            nextDetails.setVisibility(View.GONE);
            textNoNext.setVisibility(View.VISIBLE);
            return;
        }
        textNoNext.setVisibility(View.GONE);
        nextDetails.setVisibility(View.VISIBLE);
        textNextStation.setText(nextBooking.stationName);
        UiUtils.showStatusBadge(textNextStatus, nextBooking.status);
        textNextTime.setText(DateUtils.formatRange(nextBooking.startTime, nextBooking.endTime));
        textNextEnergy.setText(BookingAdapter.energyText(nextBooking));
    }

    // Opens My bookings (M8) on the given tab: "current", "pending" or "history".
    private void openBookings(String view) {
        Intent intent = new Intent(this, BookingsActivity.class);
        intent.putExtra(BookingsActivity.EXTRA_VIEW, view);
        startActivity(intent);
    }

    // Opens the next booking's details (M9), if there is one.
    private void openNextBooking() {
        if (nextBooking == null) {
            return;
        }
        Intent intent = new Intent(this, ReservationDetailActivity.class);
        intent.putExtra(ReservationDetailActivity.EXTRA_RESERVATION_ID, nextBooking.id);
        startActivity(intent);
    }

    // "Nimal Perera" -> "Nimal" (a friendlier greeting).
    private String firstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "there";
        }
        return fullName.trim().split("\\s+")[0];
    }
}
