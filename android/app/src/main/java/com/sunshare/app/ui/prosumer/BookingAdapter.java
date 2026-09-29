/*
 * ============================================================================
 *  File        : BookingAdapter.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : Turns a list of bookings into rows for the RecyclerView on
 *                the My bookings screen (M8). Each row shows the station,
 *                time, energy + type and a status badge; tapping a row tells
 *                the screen which booking was chosen.
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.sunshare.app.R;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.UiUtils;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;

// A RecyclerView only draws the rows that fit on screen and re-uses them while scrolling;
// the adapter's job is to fill a row (ViewHolder) with the booking at a given position.
public class BookingAdapter extends RecyclerView.Adapter<BookingAdapter.BookingViewHolder> {

    // What the screen does when a row is tapped.
    public interface OnBookingClickListener {
        // Called with the booking whose row was tapped.
        void onBookingClick(ReservationResponse booking);
    }

    private final List<ReservationResponse> bookings = new ArrayList<>();
    private final OnBookingClickListener listener;

    // Creates an empty adapter; the screen passes what to do when a row is tapped.
    public BookingAdapter(OnBookingClickListener listener) {
        this.listener = listener;
    }

    // Replaces the rows with a new list from the API and redraws the list.
    public void setBookings(List<ReservationResponse> newBookings) {
        bookings.clear();
        if (newBookings != null) {
            bookings.addAll(newBookings);
        }
        notifyDataSetChanged();
    }

    // Makes a new empty row from item_booking.xml (called only for the few rows visible at once).
    @NonNull
    @Override
    public BookingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View row = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_booking, parent, false);
        return new BookingViewHolder(row);
    }

    // Fills a row with the booking at this position.
    @Override
    public void onBindViewHolder(@NonNull BookingViewHolder holder, int position) {
        holder.bind(bookings.get(position), listener);
    }

    // How many rows the list has.
    @Override
    public int getItemCount() {
        return bookings.size();
    }

    // "12.5 kWh · Sell" (whole numbers without ".0", e.g. "8 kWh · Buy"). Also used by the detail screen.
    public static String energyText(ReservationResponse booking) {
        return new DecimalFormat("0.##").format(booking.energyKwh) + " kWh · " + booking.type;
    }

    // Holds the views of one row so they are found once, not on every scroll.
    static class BookingViewHolder extends RecyclerView.ViewHolder {
        private final TextView textStation;
        private final TextView textStatus;
        private final TextView textTime;
        private final TextView textEnergy;

        // Finds the row's text views.
        BookingViewHolder(@NonNull View row) {
            super(row);
            textStation = row.findViewById(R.id.textStation);
            textStatus = row.findViewById(R.id.textStatus);
            textTime = row.findViewById(R.id.textTime);
            textEnergy = row.findViewById(R.id.textEnergy);
        }

        // Shows one booking in this row and makes the whole card tappable.
        void bind(ReservationResponse booking, OnBookingClickListener listener) {
            textStation.setText(booking.stationName);
            UiUtils.showStatusBadge(textStatus, booking.status);
            textTime.setText(DateUtils.formatRange(booking.startTime, booking.endTime));
            textEnergy.setText(energyText(booking));
            itemView.setOnClickListener(v -> listener.onBookingClick(booking));
        }
    }
}
