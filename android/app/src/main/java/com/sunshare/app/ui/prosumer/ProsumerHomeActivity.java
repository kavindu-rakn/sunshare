/*
 * ============================================================================
 *  File        : ProsumerHomeActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M3 Prosumer Home - the first screen after a prosumer logs
 *                in: greeting, the actions they can take and Log out.
 *                Phase 14 builds the greeting and Log out so Login has a
 *                home to open; the count cards and next booking come from
 *                GET /api/dashboard/prosumer in Phase 16. (The My profile
 *                button was added with M4 Profile, Part A.)
 * ============================================================================
 */
package com.sunshare.app.ui.prosumer;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.sunshare.app.R;
import com.sunshare.app.db.Session;
import com.sunshare.app.db.SunShareDbHelper;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

public class ProsumerHomeActivity extends AppCompatActivity {

    private TextView textGreeting;
    private TextView textRole;

    // Called when the screen opens: keeps it clear of the phone's bars, makes sure someone
    // is logged in (else back to Login), and links the buttons.
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
        findViewById(R.id.buttonLogout).setOnClickListener(v -> SessionGuard.logout(this));
        findViewById(R.id.buttonProfile).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }

    // Called every time the screen comes to the front (also after returning from Profile,
    // where the name may have changed): shows the greeting from the saved session.
    @Override
    protected void onResume() {
        super.onResume();
        Session session = SunShareDbHelper.get(this).getSession();
        if (session == null || textGreeting == null) {
            return;
        }
        textGreeting.setText("Hello, " + firstName(session.fullName));
        textRole.setText("Prosumer · NIC " + session.nic);
    }

    // "Nimal Perera" -> "Nimal" (a friendlier greeting).
    private String firstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "there";
        }
        return fullName.trim().split("\\s+")[0];
    }
}
