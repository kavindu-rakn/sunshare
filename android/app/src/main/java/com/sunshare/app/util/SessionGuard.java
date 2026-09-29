/*
 * ============================================================================
 *  File        : SessionGuard.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Keeps logged-out users out of logged-in screens. A screen
 *                calls require() when it opens; logout and an expired token
 *                (HTTP 401) clear the SQLite session and go back to the
 *                app's first screen (Login), so Back can't return.
 * ============================================================================
 */
package com.sunshare.app.util;

import android.app.Activity;
import android.content.Intent;

import com.sunshare.app.db.Session;
import com.sunshare.app.db.SunShareDbHelper;

public final class SessionGuard {

    // Only static helpers - nobody needs to create a SessionGuard object.
    private SessionGuard() {
    }

    // Returns the logged-in user. If nobody is logged in, opens the first screen and returns null,
    // so the calling screen should stop: "Session s = SessionGuard.require(this); if (s == null) return;"
    public static Session require(Activity activity) {
        Session session = SunShareDbHelper.get(activity).getSession();
        if (session == null) {
            goToStart(activity);
        }
        return session;
    }

    // Logout button: forgets the session and goes back to the first screen.
    public static void logout(Activity activity) {
        SunShareDbHelper.get(activity).clearSession();
        goToStart(activity);
    }

    // The API answered 401 on a logged-in screen: the token expired (8 hours) or is no longer valid.
    public static void handleUnauthorized(Activity activity) {
        SunShareDbHelper.get(activity).clearSession();
        UiUtils.toast(activity, "Your session has ended. Please log in again.");
        goToStart(activity);
    }

    // Opens the app's launcher screen as a fresh start (old screens are removed, so Back can't reopen them).
    private static void goToStart(Activity activity) {
        Intent intent = activity.getPackageManager().getLaunchIntentForPackage(activity.getPackageName());
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            activity.startActivity(intent);
        }
        activity.finish();
    }
}
