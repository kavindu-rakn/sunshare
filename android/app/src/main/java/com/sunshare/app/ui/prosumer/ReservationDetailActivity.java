/*
 * ============================================================================
 *  File        : ReservationDetailActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M9 Booking details - one of the prosumer's bookings
 *                (GET /api/reservations/{id}; the API refuses other people's,
 *                R16). When the booking is Approved the API sends qrData
 *                ("SUNSHARE|<id>|<token>", R14) and this screen draws it as a
 *                QR code with ZXing for the Grid Operator to scan.
 *                (Edit / Cancel buttons: Part C, see ReservationActions.)
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.journeyapps.barcodescanner.BarcodeEncoder;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ReservationDetailActivity extends AppCompatActivity {

    // The booking to show is passed in the Intent under this name.
    public static final String EXTRA_RESERVATION_ID = "reservationId";

    private String reservationId;
    private ProgressBar progress;
    private TextView textError;
    private View content;
    private TextView textStation;
    private TextView textStatus;
    private TextView textTime;
    private TextView textEnergy;
    private TextView textBookingId;
    private TextView textHistory;
    private View cardQr;
    private ImageView imageQr;
    private TextView textNote;
    private Button buttonEdit;
    private Button buttonCancel;

    // Called when the screen opens: makes sure someone is logged in, reads which booking to show
    // and links the views. The booking itself is loaded in onResume.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reservation_detail);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        if (SessionGuard.require(this) == null) {
            return;
        }
        toolbar.setNavigationOnClickListener(v -> finish());
        reservationId = getIntent().getStringExtra(EXTRA_RESERVATION_ID);

        progress = findViewById(R.id.progress);
        textError = findViewById(R.id.textError);
        content = findViewById(R.id.content);
        textStation = findViewById(R.id.textStation);
        textStatus = findViewById(R.id.textStatus);
        textTime = findViewById(R.id.textTime);
        textEnergy = findViewById(R.id.textEnergy);
        textBookingId = findViewById(R.id.textBookingId);
        textHistory = findViewById(R.id.textHistory);
        cardQr = findViewById(R.id.cardQr);
        imageQr = findViewById(R.id.imageQr);
        textNote = findViewById(R.id.textNote);
        buttonEdit = findViewById(R.id.buttonEdit);
        buttonCancel = findViewById(R.id.buttonCancel);
    }

    // Called every time the screen comes to the front, so the details are fresh
    // (for example after the booking was edited or cancelled).
    @Override
    protected void onResume() {
        super.onResume();
        if (reservationId != null && progress != null) {
            loadReservation();
        }
    }

    // GET /api/reservations/{id} - the API only returns the caller's own booking (R16).
    private void loadReservation() {
        progress.setVisibility(View.VISIBLE);
        UiUtils.hideMessage(textError);
        ApiClient.get(this).getReservation(reservationId).enqueue(new Callback<ReservationResponse>() {
            // The API answered: show the booking, or the reason (403 not yours, 404 not found).
            @Override
            public void onResponse(Call<ReservationResponse> call, Response<ReservationResponse> response) {
                progress.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    showReservation(response.body());
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ReservationDetailActivity.this);
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ReservationResponse> call, Throwable error) {
                progress.setVisibility(View.GONE);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ReservationDetailActivity.this));
            }
        });
    }

    // Puts the booking on the screen: details, status badge, QR code (Approved only), a "what next" note
    // and the Edit / Cancel buttons.
    private void showReservation(ReservationResponse booking) {
        content.setVisibility(View.VISIBLE);
        textStation.setText(booking.stationName);
        UiUtils.showStatusBadge(textStatus, booking.status);
        textTime.setText(DateUtils.formatRange(booking.startTime, booking.endTime));
        textEnergy.setText(BookingAdapter.energyText(booking));
        textBookingId.setText("Booking ID " + booking.id);
        textHistory.setText(historyText(booking));
        showQr(booking);
        showNote(booking);
        // Edit / Cancel (Part C): shown only when the API says canModify.
        ReservationActions.show(this, booking, buttonEdit, buttonCancel);
    }

    // "Booked Mon, 28 Sep, 10:00 · Approved Tue, 29 Sep, 09:00" - when each step happened.
    private String historyText(ReservationResponse booking) {
        String text = "Booked " + DateUtils.formatDateTime(booking.createdAt);
        if (booking.approvedAt != null) {
            text += " · Approved " + DateUtils.formatDateTime(booking.approvedAt);
        }
        if (booking.completedAt != null) {
            text += " · Completed " + DateUtils.formatDateTime(booking.completedAt);
        }
        if (booking.cancelledAt != null) {
            text += " · Cancelled " + DateUtils.formatDateTime(booking.cancelledAt);
        }
        return text;
    }

    // Shows the QR card only when the API sent qrData (it does so only for Approved bookings).
    private void showQr(ReservationResponse booking) {
        Bitmap qr = booking.qrData == null || booking.qrData.isEmpty() ? null : makeQrCode(booking.qrData);
        if (qr == null) {
            cardQr.setVisibility(View.GONE);
            return;
        }
        imageQr.setImageBitmap(qr);
        cardQr.setVisibility(View.VISIBLE);
    }

    // Draws the text "SUNSHARE|<id>|<token>" as a QR code picture (600 x 600 pixels) with ZXing.
    // Reference: ZXing Android Embedded - Generate a barcode https://github.com/journeyapps/zxing-android-embedded
    private Bitmap makeQrCode(String qrData) {
        try {
            return new BarcodeEncoder().encodeBitmap(qrData, BarcodeFormat.QR_CODE, 600, 600);
        } catch (WriterException e) {
            UiUtils.toast(this, "Could not draw the QR code.");
            return null;
        }
    }

    // A short "what happens next" line for bookings that have no QR code.
    private void showNote(ReservationResponse booking) {
        String note;
        switch (booking.status == null ? "" : booking.status) {
            case "Pending":
                note = "Waiting for approval. Your QR code will appear here once a Backoffice officer or Grid Operator approves the booking.";
                break;
            case "Completed":
                note = "Energy transfer completed. Thank you for trading with SunShare!";
                break;
            case "Cancelled":
                note = "This booking was cancelled. Its place in the slot was given back.";
                break;
            default:
                note = null;
                break;
        }
        if (note == null) {
            textNote.setVisibility(View.GONE);
        } else {
            textNote.setText(note);
            textNote.setVisibility(View.VISIBLE);
        }
    }
}
