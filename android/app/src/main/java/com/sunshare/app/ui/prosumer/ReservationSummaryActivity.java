/*
 * ============================================================================
 *  File        : ReservationSummaryActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-29
 *  Description : M7 Summary - shown after every booking action (Created,
 *                Updated, Cancelled, and Completed by a Grid Operator): a big
 *                icon, what happened, the booking as the API saved it, what
 *                happens next, and buttons to My bookings / Home. The screen
 *                makes no API call: the booking the API just returned is
 *                handed over as JSON text in the Intent.
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.gson.Gson;
import com.sunshare.app.R;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.db.Session;
import com.sunshare.app.ui.operator.OperatorHomeActivity;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

public class ReservationSummaryActivity extends AppCompatActivity {

    // Names of the values passed in the Intent.
    private static final String EXTRA_RESERVATION_JSON = "reservationJson";
    private static final String EXTRA_ACTION = "action";

    // What just happened to the booking.
    public static final String ACTION_CREATED = "created";
    public static final String ACTION_UPDATED = "updated";
    public static final String ACTION_CANCELLED = "cancelled";
    public static final String ACTION_COMPLETED = "completed";

    private Session session;

    // Opens the summary for the booking the API just returned. Gson turns the booking into JSON text
    // so it can travel inside the Intent to the next screen.
    public static void open(Activity from, ReservationResponse booking, String action) {
        Intent intent = new Intent(from, ReservationSummaryActivity.class);
        intent.putExtra(EXTRA_RESERVATION_JSON, new Gson().toJson(booking));
        intent.putExtra(EXTRA_ACTION, action);
        from.startActivity(intent);
    }

    // Called when the screen opens: makes sure someone is logged in, turns the JSON back into
    // a booking and shows the summary.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reservation_summary);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), findViewById(R.id.toolbar));
        session = SessionGuard.require(this);
        if (session == null) {
            return;
        }

        String json = getIntent().getStringExtra(EXTRA_RESERVATION_JSON);
        ReservationResponse booking = new Gson().fromJson(json, ReservationResponse.class);
        if (booking == null) {
            finish();
            return;
        }
        String action = getIntent().getStringExtra(EXTRA_ACTION);
        showHeadline(booking, action);
        showBooking(booking);

        View buttonBookings = findViewById(R.id.buttonBookings);
        buttonBookings.setVisibility(session.isProsumer() ? View.VISIBLE : View.GONE);
        buttonBookings.setOnClickListener(v -> openBookings(booking));
        findViewById(R.id.buttonHome).setOnClickListener(v -> goHome());
    }

    // The big icon, the title and the "what happens next" line for this action.
    private void showHeadline(ReservationResponse booking, String action) {
        String icon = "✓";
        int color = R.color.ss_primary;
        String title;
        String next;
        if (ACTION_CANCELLED.equals(action)) {
            icon = "✕";
            color = R.color.ss_grey;
            title = "Booking cancelled";
            next = "Its place in the slot was given back. You can make a new booking any time.";
        } else if (ACTION_COMPLETED.equals(action)) {
            color = R.color.ss_success;
            title = "Energy transfer completed";
            next = "The booking is now Completed and can't be changed.";
        } else if (ACTION_UPDATED.equals(action)) {
            title = "Booking updated";
            next = "Pending".equals(booking.status)
                    ? "It is Pending until a Backoffice officer or Grid Operator approves it again. An old QR code no longer works."
                    : "Nothing needed changing, so your booking stays as it was.";
        } else {
            title = "Booking created";
            next = "It is Pending. Once a Backoffice officer or Grid Operator approves it, your QR code appears in My bookings.";
        }

        TextView textIcon = findViewById(R.id.textIcon);
        textIcon.setText(icon);
        textIcon.setBackgroundTintList(ContextCompat.getColorStateList(this, color));
        ((TextView) findViewById(R.id.textTitle)).setText(title);
        ((TextView) findViewById(R.id.textNext)).setText(next);
    }

    // The booking as the API saved it. Grid Operators also see whose booking it is.
    private void showBooking(ReservationResponse booking) {
        ((TextView) findViewById(R.id.textStation)).setText(booking.stationName);
        UiUtils.showStatusBadge(findViewById(R.id.textStatus), booking.status);
        ((TextView) findViewById(R.id.textTime)).setText(DateUtils.formatRange(booking.startTime, booking.endTime));
        ((TextView) findViewById(R.id.textEnergy)).setText(BookingAdapter.energyText(booking));
        ((TextView) findViewById(R.id.textBookingId)).setText("Booking ID " + booking.id);
        if (session.isGridOperator()) {
            TextView textProsumer = findViewById(R.id.textProsumer);
            textProsumer.setText(booking.prosumerName + " (" + booking.prosumerNic + ")");
            textProsumer.setVisibility(View.VISIBLE);
        }
    }

    // Home screen for this user's role, with every screen above it closed (so Back won't return to a form).
    private Intent homeIntent() {
        Class<?> home = session.isGridOperator() ? OperatorHomeActivity.class : ProsumerHomeActivity.class;
        Intent intent = new Intent(this, home);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return intent;
    }

    // Back to Home.
    private void goHome() {
        startActivity(homeIntent());
        finish();
    }

    // Home, then My bookings on top of it, opened on the tab this booking now belongs to.
    private void openBookings(ReservationResponse booking) {
        Intent bookings = new Intent(this, BookingsActivity.class);
        bookings.putExtra(BookingsActivity.EXTRA_VIEW, tabFor(booking.status));
        startActivities(new Intent[]{homeIntent(), bookings});
        finish();
    }

    // Pending -> the Pending tab, Approved -> Current, Completed / Cancelled -> History.
    private String tabFor(String status) {
        if ("Pending".equals(status)) {
            return "pending";
        }
        if ("Approved".equals(status)) {
            return "current";
        }
        return "history";
    }
}
