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
 *                the app does itself - real rules are in the API), put a
 *                button into a "Please wait..." state during an API call, and
 *                keep the screen clear of the phone's status/navigation bars
 *                and keyboard (edge-to-edge, required from Android 15).
 * ============================================================================
 */
package com.sunshare.app.util;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.view.ViewParent;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.material.textfield.TextInputLayout;

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

    // "Field not empty" check: shows the message on the box and returns false when nothing was typed.
    public static boolean requireFilled(EditText field, String message) {
        if (textOf(field).isEmpty()) {
            showFieldError(field, message);
            return false;
        }
        clearFieldError(field);
        return true;
    }

    // Shows an error on one box: in red under the box when it sits in a Material TextInputLayout
    // (so it never covers the box's icons), otherwise as Android's small popup.
    public static void showFieldError(EditText field, String message) {
        TextInputLayout layout = findInputLayout(field);
        if (layout != null) {
            layout.setError(message);
        } else {
            field.setError(message);
        }
        field.requestFocus();
    }

    // Removes the error from a box (called when the box is filled in on the next try).
    public static void clearFieldError(EditText field) {
        TextInputLayout layout = findInputLayout(field);
        if (layout != null) {
            layout.setError(null);
        } else {
            field.setError(null);
        }
    }

    // Walks up from the text box to the TextInputLayout around it (null if there is none).
    private static TextInputLayout findInputLayout(View view) {
        ViewParent parent = view.getParent();
        while (parent instanceof View) {
            if (parent instanceof TextInputLayout) {
                return (TextInputLayout) parent;
            }
            parent = parent.getParent();
        }
        return null;
    }

    // Shows a message in a TextView on the screen (e.g. the red error line under a form).
    public static void showMessage(TextView view, String message) {
        view.setText(message);
        view.setVisibility(View.VISIBLE);
    }

    // Hides that message again (called when the user tries again).
    public static void hideMessage(TextView view) {
        view.setText("");
        view.setVisibility(View.GONE);
    }

    // Android 15+ always draws apps behind the status bar (top) and navigation bar (bottom).
    // This keeps content clear of them: the dark top bar (toolbar or header) grows by the status bar's
    // height so the bar area is navy with white icons, and the root layout gets bottom padding for the
    // navigation bar - or for the keyboard while it is open, so the focused box is never hidden.
    // (Spacing inside the root must be margins or an inner layout: this replaces the root's padding - C8.)
    public static void setupEdgeToEdge(ComponentActivity activity, View root, View topBar) {
        EdgeToEdge.enable(activity, SystemBarStyle.dark(Color.TRANSPARENT));
        int topBarPaddingTop = topBar.getPaddingTop();
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            topBar.setPadding(topBar.getPaddingLeft(), topBarPaddingTop + bars.top,
                    topBar.getPaddingRight(), topBar.getPaddingBottom());
            v.setPadding(bars.left, 0, bars.right, Math.max(bars.bottom, keyboard.bottom));
            return insets;
        });
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
