/*
 * ============================================================================
 *  File        : OperatorHomeActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : M10 Operator Home - the first screen after a Grid Operator
 *                logs in. Phase 14 builds the greeting and Log out so Login
 *                has a home to open; today's counts (GET
 *                /api/dashboard/summary) and the Scan QR button come in
 *                Phase 18.
 * ============================================================================
 */
package com.sunshare.app.ui.operator;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.sunshare.app.R;
import com.sunshare.app.db.Session;
import com.sunshare.app.util.SessionGuard;
import com.sunshare.app.util.UiUtils;

public class OperatorHomeActivity extends AppCompatActivity {

    // Called when the screen opens: keeps it clear of the phone's bars, makes sure someone
    // is logged in (else back to Login), shows the greeting and links Log out.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_home);
        UiUtils.setupEdgeToEdge(this, findViewById(R.id.main), findViewById(R.id.header));
        Session session = SessionGuard.require(this);
        if (session == null) {
            return;
        }

        TextView textGreeting = findViewById(R.id.textGreeting);
        TextView textRole = findViewById(R.id.textRole);
        textGreeting.setText("Hello, " + firstName(session.fullName));
        textRole.setText("Grid Operator · NIC " + session.nic);
        findViewById(R.id.buttonLogout).setOnClickListener(v -> SessionGuard.logout(this));
    }

    // "Kasun Silva" -> "Kasun" (a friendlier greeting).
    private String firstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "there";
        }
        return fullName.trim().split("\\s+")[0];
    }
}
