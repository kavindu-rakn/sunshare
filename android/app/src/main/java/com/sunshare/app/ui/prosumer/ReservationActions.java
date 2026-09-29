/*
 * ============================================================================
 *  File        : ReservationActions.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-29
 *  Description : The Edit and Cancel buttons on the Booking details screen
 *                (M9). They are shown only when the API says canModify
 *                (Pending/Approved and at least 12 hours away - R10, R15).
 *                Edit opens the booking form (M6); Cancel asks first, then
 *                PATCH /api/reservations/{id}/cancel (the API gives the slot
 *                place back, R12) and opens the Summary (M7).
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.widget.Button;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public final class ReservationActions {

    // Only static helpers - nobody needs to create a ReservationActions object.
    private ReservationActions() {
    }

    // Shows Edit and Cancel only when the API allows changes (canModify), and links what they do.
    public static void show(Activity activity, ReservationResponse booking, Button buttonEdit, Button buttonCancel) {
        int visibility = booking.canModify ? View.VISIBLE : View.GONE;
        buttonEdit.setVisibility(visibility);
        buttonCancel.setVisibility(visibility);
        buttonEdit.setOnClickListener(v -> openEdit(activity, booking));
        buttonCancel.setOnClickListener(v -> confirmCancel(activity, booking, buttonCancel));
    }

    // Opens the booking form (M6) in edit mode for this booking.
    private static void openEdit(Activity activity, ReservationResponse booking) {
        Intent intent = new Intent(activity, ReservationFormActivity.class);
        intent.putExtra(ReservationFormActivity.EXTRA_RESERVATION_ID, booking.id);
        activity.startActivity(intent);
    }

    // Asks "are you sure?" first - a cancelled booking can't be brought back (R15).
    private static void confirmCancel(Activity activity, ReservationResponse booking, Button buttonCancel) {
        new MaterialAlertDialogBuilder(activity)
                .setTitle("Cancel this booking?")
                .setMessage("Your place at " + booking.stationName + " will be given back. This can't be undone.")
                .setNegativeButton("Keep it", null)
                .setPositiveButton("Cancel booking", (dialog, which) -> cancel(activity, booking, buttonCancel))
                .show();
    }

    // PATCH /api/reservations/{id}/cancel - the API checks the 12-hour rule (R10) and gives the place back (R12).
    private static void cancel(Activity activity, ReservationResponse booking, Button buttonCancel) {
        UiUtils.setLoading(buttonCancel, true);
        ApiClient.get(activity).cancelReservation(booking.id).enqueue(new Callback<ReservationResponse>() {
            // The API answered: cancelled -> Summary; otherwise its reason (e.g. less than 12 hours away).
            @Override
            public void onResponse(Call<ReservationResponse> call, Response<ReservationResponse> response) {
                UiUtils.setLoading(buttonCancel, false);
                if (response.isSuccessful() && response.body() != null) {
                    ReservationSummaryActivity.open(activity, response.body(), ReservationSummaryActivity.ACTION_CANCELLED);
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(activity);
                } else {
                    UiUtils.toast(activity, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ReservationResponse> call, Throwable error) {
                UiUtils.setLoading(buttonCancel, false);
                UiUtils.toast(activity, ApiErrorParser.fromFailure(activity));
            }
        });
    }
}
