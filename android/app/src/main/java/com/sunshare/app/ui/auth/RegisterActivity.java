/*
 * ============================================================================
 *  File        : RegisterActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : M2 Register - a new prosumer signs up with their NIC and
 *                details (POST /api/auth/register). The API checks the NIC
 *                format and that it is new (R1) and saves the account as
 *                Pending (R3), so they can log in only after a Backoffice
 *                officer activates it.
 * ============================================================================
 */
package com.sunshare.app.ui.auth;

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
import com.sunshare.app.api.models.RegisterRequest;
import com.sunshare.app.api.models.UserResponse;
import com.sunshare.app.util.UiUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    private EditText inputNic;
    private EditText inputFullName;
    private EditText inputEmail;
    private EditText inputPhone;
    private EditText inputAddress;
    private EditText inputPassword;
    private EditText inputConfirmPassword;
    private TextView textError;
    private Button buttonRegister;

    // Called when the screen opens: links the form, the back arrow and the Create account button.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), toolbar);
        toolbar.setNavigationOnClickListener(v -> finish());

        inputNic = findViewById(R.id.inputNic);
        inputFullName = findViewById(R.id.inputFullName);
        inputEmail = findViewById(R.id.inputEmail);
        inputPhone = findViewById(R.id.inputPhone);
        inputAddress = findViewById(R.id.inputAddress);
        inputPassword = findViewById(R.id.inputPassword);
        inputConfirmPassword = findViewById(R.id.inputConfirmPassword);
        textError = findViewById(R.id.textError);
        buttonRegister = findViewById(R.id.buttonRegister);
        buttonRegister.setOnClickListener(v -> register());
    }

    // Checks the boxes are filled, then sends the sign-up to the API.
    // NIC format, duplicate NIC and password length are checked by the API (R1), which sends back the message to show.
    private void register() {
        UiUtils.hideMessage(textError);
        if (!UiUtils.requireFilled(inputNic, "Please enter your NIC.")
                || !UiUtils.requireFilled(inputFullName, "Please enter your full name.")
                || !UiUtils.requireFilled(inputEmail, "Please enter your email.")
                || !UiUtils.requireFilled(inputPhone, "Please enter your phone number.")
                || !UiUtils.requireFilled(inputPassword, "Please choose a password.")
                || !UiUtils.requireFilled(inputConfirmPassword, "Please type the password again.")) {
            return;
        }
        // Typing check only: both password boxes must be the same.
        if (!UiUtils.textOf(inputPassword).equals(UiUtils.textOf(inputConfirmPassword))) {
            UiUtils.showFieldError(inputConfirmPassword, "The two passwords don't match.");
            return;
        }

        String address = UiUtils.textOf(inputAddress);
        RegisterRequest body = new RegisterRequest(
                UiUtils.textOf(inputNic),
                UiUtils.textOf(inputFullName),
                UiUtils.textOf(inputEmail),
                UiUtils.textOf(inputPhone),
                address.isEmpty() ? null : address,
                UiUtils.textOf(inputPassword));

        UiUtils.setLoading(buttonRegister, true);
        ApiClient.get(this).register(body).enqueue(new Callback<UserResponse>() {
            // The API answered: 201 = registered as Pending; 400/409 = the reason (bad NIC, NIC already used...).
            @Override
            public void onResponse(Call<UserResponse> call, Response<UserResponse> response) {
                UiUtils.setLoading(buttonRegister, false);
                if (response.isSuccessful()) {
                    showRegistered();
                } else {
                    UiUtils.showMessage(textError, ApiErrorParser.fromResponse(response));
                }
            }

            // The call never reached the API (server off, wrong address, no Wi-Fi).
            @Override
            public void onFailure(Call<UserResponse> call, Throwable error) {
                UiUtils.setLoading(buttonRegister, false);
                UiUtils.showMessage(textError, ApiErrorParser.fromFailure(RegisterActivity.this));
            }
        });
    }

    // The API saved the account as Pending (R3 is enforced there) - tell the user to wait for activation, then go back to Login.
    private void showRegistered() {
        new MaterialAlertDialogBuilder(this)
                .setTitle("Registered!")
                .setMessage("A Backoffice officer will activate your account. You can log in once it is active.")
                .setCancelable(false)
                .setPositiveButton("Back to login", (dialog, which) -> finish())
                .show();
    }
}
