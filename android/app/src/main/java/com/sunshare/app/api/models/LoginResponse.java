/*
 * ============================================================================
 *  File        : LoginResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Answer of a successful login: the JWT token plus who
 *                the user is (saved in the SQLite session table).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// { token, nic, fullName, role, expiresAt } - the role decides which home screen opens.
public class LoginResponse {
    public String token;
    public String nic;
    public String fullName;
    public String role;
    public String expiresAt;
}
