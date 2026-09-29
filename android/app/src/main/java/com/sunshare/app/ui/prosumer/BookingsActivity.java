/*
 * ============================================================================
 *  File        : BookingsActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M8 My bookings - the prosumer's own bookings in three tabs:
 *                Current (Approved, still to come), Pending, and History
 *                (Completed, Cancelled or already started), plus a search
 *                box (station name or full booking id). The API decides what
 *                belongs in each tab (GET /api/reservations?view=&search=,
 *                docs/01-SPEC.md section 5); tapping a booking opens M9.
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.tabs.TabLayout;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookingsActivity extends AppCompatActivity {

    // Which tab to open first; the value is one of VIEWS (e.g. "pending"). Used by the Home count cards.
    public static final String EXTRA_VIEW = "view";

    // Tab position -> the API's view name, the tab's title and the text shown when it is empty.
    private static final String[] VIEWS = {"current", "pending", "history"};
    private static final String[] TITLES = {"Current", "Pending", "History"};
    private static final String[] EMPTY_TEXTS = {
            "No upcoming approved bookings.",
            "No bookings waiting for approval.",
            "No completed or cancelled bookings yet."};

    private TabLayout tabs;
    private EditText inputSearch;
    private ProgressBar progress;
    private TextView textMessage;
    private final BookingAdapter adapter = new BookingAdapter(this::openDetail);
    // The list request that is running now, so a newer one can cancel it.
    private Call<List<ReservationResponse>> currentCall;

    // Called when the screen opens: makes sure someone is logged in, builds the tabs,
    // links the search box and the list. The first load happens in onResume.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_bookings);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        if (SessionGuard.require(this) == null) {
            return;
        }
        toolbar.setNavigationOnClickListener(v -> finish());

        tabs = findViewById(R.id.tabs);
        inputSearch = findViewById(R.id.inputSearch);
        progress = findViewById(R.id.progress);
        textMessage = findViewById(R.id.textMessage);
        RecyclerView list = findViewById(R.id.list);
        list.setLayoutManager(new LinearLayoutManager(this));
        list.setAdapter(adapter);

        setupTabs(getIntent().getStringExtra(EXTRA_VIEW));
        setupSearch();
    }

    // Called every time the screen comes to the front: reloads, so a booking changed elsewhere shows its new status.
    @Override
    protected void onResume() {
        super.onResume();
        if (tabs != null) {
            loadBookings();
        }
    }

    // Adds the three tabs, selects the one asked for (default Current) and reloads when another tab is chosen.
    private void setupTabs(String startView) {
        for (String title : TITLES) {
            tabs.addTab(tabs.newTab().setText(title));
        }
        for (int i = 0; i < VIEWS.length; i++) {
            if (VIEWS[i].equals(startView)) {
                tabs.selectTab(tabs.getTabAt(i));
            }
        }
        tabs.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            // A different tab was chosen: load that list.
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                loadBookings();
            }

            // Nothing to do when a tab is left.
            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
            }

            // Tapping the open tab again reloads it.
            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                loadBookings();
            }
        });
    }

    // Searches when the keyboard's search key is pressed, and shows the full list again when the box is cleared.
    private void setupSearch() {
        inputSearch.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                loadBookings();
                return true;
            }
            return false;
        });
        inputSearch.addTextChangedListener(new TextWatcher() {
            // Not needed.
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            // Not needed.
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            // The box became empty (typed away or the clear button): show the whole tab again.
            @Override
            public void afterTextChanged(Editable s) {
                if (s.length() == 0) {
                    loadBookings();
                }
            }
        });
    }

    // GET /api/reservations?view=<tab>&search=<text>. A request still running for an older tab or search
    // is cancelled first, so a slow old answer can never overwrite a newer one.
    private void loadBookings() {
        if (currentCall != null) {
            currentCall.cancel();
        }
        int tab = Math.max(tabs.getSelectedTabPosition(), 0);
        String search = UiUtils.textOf(inputSearch);
        progress.setVisibility(View.VISIBLE);
        textMessage.setVisibility(View.GONE);

        currentCall = ApiClient.get(this).getReservations(VIEWS[tab], search.isEmpty() ? null : search);
        currentCall.enqueue(new Callback<List<ReservationResponse>>() {
            // The API answered: show the list, or the reason it failed.
            @Override
            public void onResponse(Call<List<ReservationResponse>> call, Response<List<ReservationResponse>> response) {
                progress.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    showBookings(response.body(), tab, search);
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(BookingsActivity.this);
                } else {
                    showError(ApiErrorParser.fromResponse(response));
                }
            }

            // No answer. A cancelled call also ends here - that one is simply ignored.
            @Override
            public void onFailure(Call<List<ReservationResponse>> call, Throwable error) {
                if (call.isCanceled()) {
                    return;
                }
                progress.setVisibility(View.GONE);
                showError(ApiErrorParser.fromFailure(BookingsActivity.this));
            }
        });
    }

    // Shows the bookings, or a friendly "nothing here" line when the list is empty.
    private void showBookings(List<ReservationResponse> bookings, int tab, String search) {
        adapter.setBookings(bookings);
        if (bookings.isEmpty()) {
            String message = search.isEmpty() ? EMPTY_TEXTS[tab] : "No bookings match \"" + search + "\".";
            showMessage(message, R.color.ss_muted);
        }
    }

    // Empties the list and shows the error in red.
    private void showError(String message) {
        adapter.setBookings(null);
        showMessage(message, R.color.ss_danger);
    }

    // Shows a line of text in the middle of the list area, in the given colour.
    private void showMessage(String message, int colorRes) {
        textMessage.setText(message);
        textMessage.setTextColor(ContextCompat.getColor(this, colorRes));
        textMessage.setVisibility(View.VISIBLE);
    }

    // A row was tapped: open its details (M9).
    private void openDetail(ReservationResponse booking) {
        Intent intent = new Intent(this, ReservationDetailActivity.class);
        intent.putExtra(ReservationDetailActivity.EXTRA_RESERVATION_ID, booking.id);
        startActivity(intent);
    }
}
