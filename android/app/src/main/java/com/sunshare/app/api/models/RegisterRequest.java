/*
 * ============================================================================
 *  File        : RegisterRequest.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : JSON body for POST /api/auth/register (prosumer sign-up
 *                on the Register screen).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// The new prosumer's details. The API makes the account a Pending Prosumer (R3).
public class RegisterRequest {
    public String nic;
    public String fullName;
    public String email;
    public String phone;
    public String address;
    public String password;

    // Builds the request from the Register form.
    public RegisterRequest(String nic, String fullName, String email, String phone, String address, String password) {
        this.nic = nic;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.password = password;
    }
}
