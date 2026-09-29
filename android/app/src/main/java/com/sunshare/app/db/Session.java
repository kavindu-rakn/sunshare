/*
 * ============================================================================
 *  File        : Session.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : The logged-in user as saved in the SQLite "session" table:
 *                NIC, name, role and the JWT token that is sent with every
 *                API call.
 * ============================================================================
 */
package com.sunshare.app.db;

import com.sunshare.app.api.models.LoginResponse;

import java.time.Instant;

public class Session {

    public static final String ROLE_PROSUMER = "Prosumer";
    public static final String ROLE_GRID_OPERATOR = "GridOperator";
    public static final String ROLE_BACKOFFICE = "Backoffice";

    public final String nic;
    public final String fullName;
    public final String role;
    public final String token;
    public final String loggedInAt;

    // Builds a session from the five columns of the session table.
    public Session(String nic, String fullName, String role, String token, String loggedInAt) {
        this.nic = nic;
        this.fullName = fullName;
        this.role = role;
        this.token = token;
        this.loggedInAt = loggedInAt;
    }

    // Builds a session from the API's login answer, stamped with the current time.
    public static Session fromLogin(LoginResponse login) {
        return new Session(login.nic, login.fullName, login.role, login.token, Instant.now().toString());
    }

    // True when the logged-in user is a Prosumer.
    public boolean isProsumer() {
        return ROLE_PROSUMER.equals(role);
    }

    // True when the logged-in user is a Grid Operator.
    public boolean isGridOperator() {
        return ROLE_GRID_OPERATOR.equals(role);
    }
}
