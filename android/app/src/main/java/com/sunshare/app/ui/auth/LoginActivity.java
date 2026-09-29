/*
 * ============================================================================
 *  File        : LoginActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : M1 Login - the app's first screen. If a session is saved in
 *                SQLite the user goes straight to their home screen (stay
 *                logged in). Otherwise NIC + password -> POST /api/auth/login
 *                -> the session (token) is saved in SQLite -> Prosumer opens
 *                Prosumer Home (M3), Grid Operator opens Operator Home (M10),
 *                Backoffice is told to use the web app. The API decides
 *                wrong password / Pending (R3) / Deactivated (R4).
 *                The ⚙ Server button changes the API address (saved in SQLite).
 * ============================================================================
 */
package com.sunshare.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiConfig;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.HealthResponse;
import com.sunshare.app.api.models.LoginRequest;
import com.sunshare.app.api.models.LoginResponse;
import com.sunshare.app.db.Session;
import com.sunshare.app.db.SunShareDbHelper;
import com.sunshare.app.ui.operator.OperatorHomeActivity;
import com.sunshare.app.ui.prosumer.ProsumerHomeActivity;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText inputNic;
    private EditText inputPassword;
    private TextView textError;
    private TextView textServer;
    private Button buttonLogin;

    // Called when the app starts. A saved session skips the form (stay logged in);
    // otherwise the form, the Register link and the ⚙ Server button are linked.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Session saved = SunShareDbHelper.get(this).getSession();
        if (saved != null) {
            openHome(saved);
            return;
        }

        setContentView(R.layout.activity_login);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), findViewById(R.id.header));
        inputNic = findViewById(R.id.inputNic);
        inputPassword = findViewById(R.id.inputPassword);
        textError = findViewById(R.id.textError);
        textServer = findViewById(R.id.textServer);
        buttonLogin = findViewById(R.id.buttonLogin);

        buttonLogin.setOnClickListener(v -> login());
        // Pressing "Done" on the keyboard in the password box also logs in.
        inputPassword.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                login();
                return true;
            }
            return false;
        });
        findViewById(R.id.buttonRegister).setOnClickListener(v -> startActivity(new Intent(this, RegisterActivity.class)));
        findViewById(R.id.buttonServer).setOnClickListener(v -> showServerDialog());
        showServerAddress();
    }

    // Checks both boxes are filled, then asks the API to log in.
    private void login() {
        UiUtils.hideMessage(textError);
        if (!UiUtils.requireFilled(inputNic, "Please enter your NIC.")
                || !UiUtils.requireFilled(inputPassword, "Please enter your password.")) {
            return;
        }
        LoginRequest body = new LoginRequest(UiUtils.textOf(inputNic), UiUtils.textOf(inputPassword));

        UiUtils.setLoading(buttonLogin, true);
        ApiClient.get(this).login(body).enqueue(new Callback<LoginResponse>() {
            // The API answered: 200 = logged in; 401 wrong NIC/password, 403 Pending (R3) or Deactivated (R4).
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                UiUtils.setLoading(buttonLogin, false);
                if (response.isSuccessful() && response.body() != null) {
                    onLoggedIn(response.body());
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API - usually the server address (⚙) is wrong.
            @Override
            public void onFailure(Call<LoginResponse> call, Throwable error) {
                UiUtils.setLoading(buttonLogin, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(LoginActivity.this));
            }
        });
    }

    // Saves the session in SQLite and opens the home screen for the user's role.
    // Backoffice work is done on the web app, so a Backoffice session is not saved on the phone.
    private void onLoggedIn(LoginResponse login) {
        if (Session.ROLE_BACKOFFICE.equals(login.role)) {
            UiUtils.showMessage(textError, "Backoffice accounts use the SunShare web app. Please log in on a computer.");
            return;
        }
        Session session = Session.fromLogin(login);
        SunShareDbHelper.get(this).saveSession(session);
        openHome(session);
    }

    // Opens Operator Home (M10) for Grid Operators, Prosumer Home (M3) for prosumers,
    // and closes Login so the Back button doesn't return to it.
    private void openHome(Session session) {
        Class<?> home = session.isGridOperator() ? OperatorHomeActivity.class : ProsumerHomeActivity.class;
        startActivity(new Intent(this, home));
        finish();
    }

    // Shows which server the app is talking to, under the form.
    private void showServerAddress() {
        textServer.setText("Server: " + ApiConfig.getBaseUrl(this));
    }

    // ⚙ Server: a box to type the API address (emulator 10.0.2.2, or the laptop's Wi-Fi IP on a real phone).
    private void showServerDialog() {
        View view = getLayoutInflater().inflate(R.layout.dialog_server_address, null);
        EditText inputServerUrl = view.findViewById(R.id.inputServerUrl);
        inputServerUrl.setText(ApiConfig.getBaseUrl(this));

        new MaterialAlertDialogBuilder(this)
                .setTitle("Server address")
                .setView(view)
                .setNegativeButton("Cancel", null)
                .setNeutralButton("Default", (dialog, which) -> saveServer(ApiConfig.DEFAULT_BASE_URL))
                .setPositiveButton("Save", (dialog, which) -> saveServer(UiUtils.textOf(inputServerUrl)))
                .show();
    }

    // Saves the new address in SQLite (if it looks like a web address), then tests it with GET /api/health.
    private void saveServer(String url) {
        if (!ApiConfig.isValidBaseUrl(url)) {
            UiUtils.toast(this, "That doesn't look like a server address, e.g. http://192.168.1.7:8080/");
            return;
        }
        ApiConfig.setBaseUrl(this, url);
        showServerAddress();
        testServer();
    }

    // Calls GET /api/health on the new address and says whether it worked.
    private void testServer() {
        ApiClient.get(this).health().enqueue(new Callback<HealthResponse>() {
            // The API answered: connected, or the API is up but MongoDB is not (503).
            @Override
            public void onResponse(Call<HealthResponse> call, Response<HealthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    UiUtils.toast(LoginActivity.this, "Connected: API " + response.body().api + ", database " + response.body().database + ".");
                } else {
                    UiUtils.toast(LoginActivity.this, "The server answered, but not OK (HTTP " + response.code() + ").");
                }
            }

            // Nothing answered at that address (kept short: Android shows only 2 lines of a toast).
            @Override
            public void onFailure(Call<HealthResponse> call, Throwable error) {
                UiUtils.toast(LoginActivity.this, "Saved, but can't reach " + ApiConfig.getBaseUrl(LoginActivity.this));
            }
        });
    }
}
