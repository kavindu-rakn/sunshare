/*
 * ============================================================================
 *  File        : UiUtils.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Small screen helpers every Activity uses: show a message,
 *                read a text box, check a box is not empty (the only check
 *                the app does itself - real rules are in the API) and put a
 *                button into a "Please wait..." state during an API call.
 * ============================================================================
 */
package com.sunshare.app.util;

import android.content.Context;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public final class UiUtils {

    // Only static helpers - nobody needs to create a UiUtils object.
    private UiUtils() {
    }

    // Shows a short message at the bottom of the screen (used for API messages and errors).
    public static void toast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }

    // Returns what the user typed, without spaces at the start or end.
    public static String textOf(EditText field) {
        return field.getText() == null ? "" : field.getText().toString().trim();
    }

    // "Field not empty" check: marks the box with the message and returns false when nothing was typed.
    public static boolean requireFilled(EditText field, String message) {
        if (textOf(field).isEmpty()) {
            field.setError(message);
            field.requestFocus();
            return false;
        }
        return true;
    }

    // Disables the button and shows "Please wait..." while a call runs, then puts the old text back.
    // The old text is kept in the button's tag so no extra variable is needed in the screen.
    public static void setLoading(Button button, boolean loading) {
        if (loading) {
            if (button.getTag() == null) {
                button.setTag(button.getText());
            }
            button.setText("Please wait…");
            button.setEnabled(false);
        } else {
            if (button.getTag() != null) {
                button.setText((CharSequence) button.getTag());
                button.setTag(null);
            }
            button.setEnabled(true);
        }
    }
}
