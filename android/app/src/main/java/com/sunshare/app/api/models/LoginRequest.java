/*
 * ============================================================================
 *  File        : LoginRequest.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : JSON body for POST /api/auth/login.
 * ============================================================================
 */
package com.sunshare.app.api.models;

// What the user typed on the Login screen.
public class LoginRequest {
    public String nic;
    public String password;

    // Builds the request from the two text boxes.
    public LoginRequest(String nic, String password) {
        this.nic = nic;
        this.password = password;
    }
}
