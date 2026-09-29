/*
 * ============================================================================
 *  File        : ReservationFormActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-29
 *  Description : M6 Booking form - a prosumer books a slot, or edits one:
 *                station (GET /api/stations?activeOnly=true) -> bookable slot
 *                at that station (GET /api/slots/available) -> kWh -> Sell or
 *                Buy -> POST /api/reservations (new) or PUT
 *                /api/reservations/{id} (edit). The API checks every rule
 *                (R9 7 days, R10 12 hours, R11 free place, R12 counter, R13
 *                back to Pending, R17 kWh) and its message is shown here.
 *                On success the Summary screen (M7) opens.
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.textfield.TextInputLayout;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.CreateReservationRequest;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.api.models.SlotResponse;
import com.sunshare.app.api.models.StationResponse;
import com.sunshare.app.api.models.UpdateReservationRequest;
import com.sunshare.app.util.DateUtils;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ReservationFormActivity extends AppCompatActivity {

    // Present = edit this booking; missing = make a new booking.
    public static final String EXTRA_RESERVATION_ID = "reservationId";

    private String reservationId;
    private ReservationResponse current;
    private final List<StationResponse> stations = new ArrayList<>();
    private final List<SlotResponse> slots = new ArrayList<>();
    private String chosenStationId;
    private String chosenSlotId;
    // The slot list request that is running now, so choosing another station can cancel it.
    private Call<List<SlotResponse>> slotsCall;

    private AutoCompleteTextView inputStation;
    private TextInputLayout layoutSlot;
    private AutoCompleteTextView inputSlot;
    private EditText inputEnergy;
    private RadioButton radioSell;
    private RadioButton radioBuy;
    private TextView textError;
    private Button buttonSave;

    // Called when the screen opens: makes sure someone is logged in, switches the texts to
    // "edit" mode when a booking id was passed, links the lists and loads the stations.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reservation_form);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        if (SessionGuard.require(this) == null) {
            return;
        }
        toolbar.setNavigationOnClickListener(v -> finish());

        inputStation = findViewById(R.id.inputStation);
        layoutSlot = findViewById(R.id.layoutSlot);
        inputSlot = findViewById(R.id.inputSlot);
        inputEnergy = findViewById(R.id.inputEnergy);
        radioSell = findViewById(R.id.radioSell);
        radioBuy = findViewById(R.id.radioBuy);
        textError = findViewById(R.id.textError);
        buttonSave = findViewById(R.id.buttonSave);

        reservationId = getIntent().getStringExtra(EXTRA_RESERVATION_ID);
        if (reservationId != null) {
            toolbar.setTitle(R.string.form_title_edit);
            ((TextView) findViewById(R.id.textIntro)).setText(R.string.form_intro_edit);
            buttonSave.setText(R.string.save_changes);
        }

        inputStation.setOnItemClickListener((parent, view, position, id) -> onStationChosen(stations.get(position)));
        inputSlot.setOnItemClickListener((parent, view, position, id) -> {
            chosenSlotId = slots.get(position).id;
            UiUtils.clearFieldError(inputSlot);
        });
        buttonSave.setOnClickListener(v -> save());
        loadStations();
    }

    // GET /api/stations?activeOnly=true - fills the station list; in edit mode the booking is loaded next.
    private void loadStations() {
        UiUtils.setLoading(buttonSave, true);
        ApiClient.get(this).getStations(true).enqueue(new Callback<List<StationResponse>>() {
            // The API answered: show the stations, or the reason it failed.
            @Override
            public void onResponse(Call<List<StationResponse>> call, Response<List<StationResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    showStations(response.body());
                    if (reservationId != null) {
                        loadBooking();
                    } else {
                        UiUtils.setLoading(buttonSave, false);
                    }
                } else {
                    UiUtils.setLoading(buttonSave, false);
                    handleError(response);
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<List<StationResponse>> call, Throwable error) {
                UiUtils.setLoading(buttonSave, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ReservationFormActivity.this));
            }
        });
    }

    // Puts the station names into the station drop-down.
    private void showStations(List<StationResponse> list) {
        stations.clear();
        stations.addAll(list);
        List<String> names = new ArrayList<>();
        for (StationResponse station : stations) {
            names.add(station.name);
        }
        inputStation.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, names));
    }

    // Edit mode: GET /api/reservations/{id}, then fills the form with the booking's current choices.
    private void loadBooking() {
        ApiClient.get(this).getReservation(reservationId).enqueue(new Callback<ReservationResponse>() {
            // The API answered: fill the form, or show why the booking can't be loaded.
            @Override
            public void onResponse(Call<ReservationResponse> call, Response<ReservationResponse> response) {
                UiUtils.setLoading(buttonSave, false);
                if (response.isSuccessful() && response.body() != null) {
                    fillForm(response.body());
                } else {
                    handleError(response);
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ReservationResponse> call, Throwable error) {
                UiUtils.setLoading(buttonSave, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ReservationFormActivity.this));
            }
        });
    }

    // Shows the booking's station, slot, kWh and type. If the API says it can't be changed any more
    // (canModify = false: finished, cancelled or less than 12 hours away), saving is switched off.
    private void fillForm(ReservationResponse booking) {
        current = booking;
        inputEnergy.setText(new DecimalFormat("0.##").format(booking.energyKwh));
        radioBuy.setChecked("Buy".equals(booking.type));
        radioSell.setChecked(!"Buy".equals(booking.type));
        for (StationResponse station : stations) {
            if (station.id.equals(booking.stationId)) {
                inputStation.setText(station.name, false);
                chosenStationId = station.id;
                loadSlots(station.id, booking.slotId);
            }
        }
        if (!booking.canModify) {
            UiUtils.showMessage(textError, "This booking can no longer be changed (it is finished, cancelled, or starts in less than 12 hours).");
            buttonSave.setEnabled(false);
        }
    }

    // A station was picked: forget the old slot and load this station's bookable slots.
    private void onStationChosen(StationResponse station) {
        UiUtils.clearFieldError(inputStation);
        if (station.id.equals(chosenStationId)) {
            return;
        }
        chosenStationId = station.id;
        chosenSlotId = null;
        inputSlot.setText("", false);
        loadSlots(station.id, null);
    }

    // GET /api/slots/available?stationId= - only slots the API says can be booked (active, a free place,
    // in the future and within 7 days - R9, R11). keepSlotId (edit mode) is selected again afterwards.
    private void loadSlots(String stationId, String keepSlotId) {
        if (slotsCall != null) {
            slotsCall.cancel();
        }
        layoutSlot.setEnabled(false);
        layoutSlot.setHelperText("Loading slots…");
        slotsCall = ApiClient.get(this).getAvailableSlots(stationId);
        slotsCall.enqueue(new Callback<List<SlotResponse>>() {
            // The API answered: show the slots, or the reason it failed.
            @Override
            public void onResponse(Call<List<SlotResponse>> call, Response<List<SlotResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    showSlots(stationId, response.body(), keepSlotId);
                } else {
                    layoutSlot.setHelperText(null);
                    handleError(response);
                }
            }

            // No answer. A cancelled call (another station was picked) is simply ignored.
            @Override
            public void onFailure(Call<List<SlotResponse>> call, Throwable error) {
                if (call.isCanceled()) {
                    return;
                }
                layoutSlot.setHelperText(null);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ReservationFormActivity.this));
            }
        });
    }

    // Puts the slots into the slot drop-down. When editing, the booking's own slot stays in the list
    // even if it is now full (its place is held by this booking) - same as the web form.
    private void showSlots(String stationId, List<SlotResponse> list, String keepSlotId) {
        slots.clear();
        if (current != null && stationId.equals(current.stationId) && !containsSlot(list, current.slotId)) {
            slots.add(currentSlotOf(current));
        }
        slots.addAll(list);

        List<String> labels = new ArrayList<>();
        for (SlotResponse slot : slots) {
            labels.add(slotLabel(slot));
        }
        inputSlot.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, labels));
        layoutSlot.setEnabled(true);
        layoutSlot.setHelperText(slots.isEmpty()
                ? "No bookable slots at this station in the next 7 days."
                : "Only slots in the next 7 days with a free place are shown.");

        for (int i = 0; i < slots.size(); i++) {
            if (slots.get(i).id.equals(keepSlotId)) {
                inputSlot.setText(labels.get(i), false);
                chosenSlotId = keepSlotId;
            }
        }
    }

    // True when the list already has a slot with this id.
    private boolean containsSlot(List<SlotResponse> list, String slotId) {
        for (SlotResponse slot : list) {
            if (slot.id.equals(slotId)) {
                return true;
            }
        }
        return false;
    }

    // A list entry for the booking's own slot, built from the booking (availableSlots -1 = "current").
    private SlotResponse currentSlotOf(ReservationResponse booking) {
        SlotResponse slot = new SlotResponse();
        slot.id = booking.slotId;
        slot.stationId = booking.stationId;
        slot.startTime = booking.startTime;
        slot.endTime = booking.endTime;
        slot.availableSlots = -1;
        return slot;
    }

    // "Thu, 1 Oct, 08:00 - 10:00 · 3 free", or "... (your current slot)".
    private String slotLabel(SlotResponse slot) {
        String time = DateUtils.formatRange(slot.startTime, slot.endTime);
        return slot.availableSlots < 0 ? time + " (your current slot)" : time + " · " + slot.availableSlots + " free";
    }

    // Checks a station, a slot and a kWh number were given, then sends the booking to the API.
    // Whether the booking is allowed (7 days, 12 hours, free place, 0-100 kWh) is decided by the API.
    private void save() {
        UiUtils.hideMessage(textError);
        if (chosenStationId == null) {
            UiUtils.showFieldError(inputStation, "Please choose a station.");
            return;
        }
        if (chosenSlotId == null) {
            UiUtils.showFieldError(inputSlot, "Please choose a time slot.");
            return;
        }
        if (!UiUtils.requireFilled(inputEnergy, "Please enter the energy in kWh.")) {
            return;
        }
        double energyKwh;
        try {
            energyKwh = Double.parseDouble(UiUtils.textOf(inputEnergy));
        } catch (NumberFormatException notANumber) {
            UiUtils.showFieldError(inputEnergy, "Please enter a number, e.g. 12.5");
            return;
        }
        String type = radioBuy.isChecked() ? "Buy" : "Sell";

        UiUtils.setLoading(buttonSave, true);
        if (reservationId == null) {
            ApiClient.get(this).createReservation(new CreateReservationRequest(chosenSlotId, energyKwh, type))
                    .enqueue(saveCallback(ReservationSummaryActivity.ACTION_CREATED));
        } else {
            ApiClient.get(this).updateReservation(reservationId, new UpdateReservationRequest(chosenSlotId, energyKwh, type))
                    .enqueue(saveCallback(ReservationSummaryActivity.ACTION_UPDATED));
        }
    }

    // What to do with the API's answer to a create or update: success opens the Summary (M7) and closes
    // this form (so Back can't submit it twice); otherwise the API's reason is shown.
    private Callback<ReservationResponse> saveCallback(String action) {
        return new Callback<ReservationResponse>() {
            // The API answered: saved, or refused with a reason (e.g. the 7-day or 12-hour rule, slot full).
            @Override
            public void onResponse(Call<ReservationResponse> call, Response<ReservationResponse> response) {
                UiUtils.setLoading(buttonSave, false);
                if (response.isSuccessful() && response.body() != null) {
                    ReservationSummaryActivity.open(ReservationFormActivity.this, response.body(), action);
                    finish();
                } else {
                    handleError(response);
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<ReservationResponse> call, Throwable error) {
                UiUtils.setLoading(buttonSave, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ReservationFormActivity.this));
            }
        };
    }

    // An API error: 401 = the login ended (back to Login); anything else shows the API's message in red.
    private void handleError(Response<?> response) {
        if (response.code() == 401) {
            SessionGuard.handleUnauthorized(this);
        } else {
            UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
        }
    }
}
