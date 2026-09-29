/*
 * ============================================================================
 *  File        : ProfileActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : M4 Profile - the prosumer sees and edits their own details
 *                and can set a new password (GET / PUT /api/profile). They
 *                can also deactivate their own account (PATCH
 *                /api/profile/deactivate, R5); the app then forgets the
 *                session and goes back to Login. The API takes the NIC from
 *                the login token, so nobody can edit someone else (R16).
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.sunshare.app.R;
import com.sunshare.app.api.ApiClient;
import com.sunshare.app.api.ApiErrorParser;
import com.sunshare.app.api.models.MessageResponse;
import com.sunshare.app.api.models.UpdateProfileRequest;
import com.sunshare.app.api.models.UserResponse;
import com.sunshare.app.db.Session;
import com.sunshare.app.db.SunShareDbHelper;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {

    private TextView textNic;
    private TextView textStatus;
    private EditText inputFullName;
    private EditText inputEmail;
    private EditText inputPhone;
    private EditText inputAddress;
    private EditText inputNewPassword;
    private TextView textError;
    private Button buttonSave;
    private Button buttonDeactivate;

    // Called when the screen opens: makes sure someone is logged in, links the form and buttons,
    // then loads the current details from the API.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        if (SessionGuard.require(this) == null) {
            return;
        }
        toolbar.setNavigationOnClickListener(v -> finish());

        textNic = findViewById(R.id.textNic);
        textStatus = findViewById(R.id.textStatus);
        inputFullName = findViewById(R.id.inputFullName);
        inputEmail = findViewById(R.id.inputEmail);
        inputPhone = findViewById(R.id.inputPhone);
        inputAddress = findViewById(R.id.inputAddress);
        inputNewPassword = findViewById(R.id.inputNewPassword);
        textError = findViewById(R.id.textError);
        buttonSave = findViewById(R.id.buttonSave);
        buttonDeactivate = findViewById(R.id.buttonDeactivate);
        buttonSave.setOnClickListener(v -> save());
        buttonDeactivate.setOnClickListener(v -> confirmDeactivate());

        loadProfile();
    }

    // GET /api/profile - fills the form with the details saved on the server.
    private void loadProfile() {
        UiUtils.setLoading(buttonSave, true);
        ApiClient.get(this).getProfile().enqueue(new Callback<UserResponse>() {
            // The API answered: show the details, or the reason it failed.
            @Override
            public void onResponse(Call<UserResponse> call, Response<UserResponse> response) {
                UiUtils.setLoading(buttonSave, false);
                if (response.isSuccessful() && response.body() != null) {
                    showUser(response.body());
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ProfileActivity.this);
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<UserResponse> call, Throwable error) {
                UiUtils.setLoading(buttonSave, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ProfileActivity.this));
            }
        });
    }

    // Puts the API's user details into the screen.
    private void showUser(UserResponse user) {
        textNic.setText("NIC " + user.nic);
        textStatus.setText(user.role + " · " + user.status);
        inputFullName.setText(user.fullName);
        inputEmail.setText(user.email);
        inputPhone.setText(user.phone);
        inputAddress.setText(user.address);
        inputNewPassword.setText("");
    }

    // PUT /api/profile - saves the edited details. An empty new-password box keeps the old password;
    // the API checks email, phone and password length and sends back the message to show.
    private void save() {
        UiUtils.hideMessage(textError);
        if (!UiUtils.requireFilled(inputFullName, "Please enter your full name.")
                || !UiUtils.requireFilled(inputEmail, "Please enter your email.")
                || !UiUtils.requireFilled(inputPhone, "Please enter your phone number.")) {
            return;
        }
        String address = UiUtils.textOf(inputAddress);
        String newPassword = UiUtils.textOf(inputNewPassword);
        UpdateProfileRequest body = new UpdateProfileRequest(
                UiUtils.textOf(inputFullName),
                UiUtils.textOf(inputEmail),
                UiUtils.textOf(inputPhone),
                address.isEmpty() ? null : address,
                newPassword.isEmpty() ? null : newPassword);

        UiUtils.setLoading(buttonSave, true);
        ApiClient.get(this).updateProfile(body).enqueue(new Callback<UserResponse>() {
            // The API answered: saved, or the reason it was refused.
            @Override
            public void onResponse(Call<UserResponse> call, Response<UserResponse> response) {
                UiUtils.setLoading(buttonSave, false);
                if (response.isSuccessful() && response.body() != null) {
                    showUser(response.body());
                    rememberNewName(response.body().fullName);
                    UiUtils.toast(ProfileActivity.this, "Profile saved.");
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ProfileActivity.this);
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<UserResponse> call, Throwable error) {
                UiUtils.setLoading(buttonSave, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ProfileActivity.this));
            }
        });
    }

    // Updates the name in the SQLite session so the Home greeting shows the new name.
    private void rememberNewName(String fullName) {
        SunShareDbHelper db = SunShareDbHelper.get(this);
        Session old = db.getSession();
        if (old != null) {
            db.saveSession(new Session(old.nic, fullName, old.role, old.token, old.loggedInAt));
        }
    }

    // Asks "are you sure?" first - deactivating means the prosumer can't log in until Backoffice reactivates them.
    private void confirmDeactivate() {
        new MaterialAlertDialogBuilder(this)
                .setTitle("Deactivate your account?")
                .setMessage("You will be logged out and can't log in again until a Backoffice officer reactivates your account.")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Deactivate", (dialog, which) -> deactivate())
                .show();
    }

    // PATCH /api/profile/deactivate (R5) - then forgets the session and returns to Login.
    private void deactivate() {
        UiUtils.hideMessage(textError);
        UiUtils.setLoading(buttonDeactivate, true);
        ApiClient.get(this).deactivateProfile().enqueue(new Callback<MessageResponse>() {
            // The API answered: deactivated -> log out; otherwise show the reason.
            @Override
            public void onResponse(Call<MessageResponse> call, Response<MessageResponse> response) {
                UiUtils.setLoading(buttonDeactivate, false);
                if (response.isSuccessful()) {
                    MessageResponse body = response.body();
                    UiUtils.toast(ProfileActivity.this, body != null && body.message != null ? body.message : "Account deactivated.");
                    SessionGuard.logout(ProfileActivity.this);
                } else if (response.code() == 401) {
                    SessionGuard.handleUnauthorized(ProfileActivity.this);
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API.
            @Override
            public void onFailure(Call<MessageResponse> call, Throwable error) {
                UiUtils.setLoading(buttonDeactivate, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(ProfileActivity.this));
            }
        });
    }
}
