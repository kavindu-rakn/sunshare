/*
 * ============================================================================
 *  File        : QrScanActivity.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : ZXing's camera scanner screen, with one change: on Android
 *                15+ apps are drawn behind the status and navigation bars, so
 *                the scanner's hint text ended up hidden under the navigation
 *                bar. This screen pads the scanner by the size of those bars.
 *                Everything else (camera, permission, decoding) is ZXing's.
 * ============================================================================
 */
package com.sunshare.app.ui.operator;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.journeyapps.barcodescanner.CaptureActivity;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;

public class QrScanActivity extends CaptureActivity {

    // ZXing calls this to build the scanner view; we keep its view and add padding for the phone's bars.
    @Override
    protected DecoratedBarcodeView initializeContent() {
        DecoratedBarcodeView scanner = super.initializeContent();
        ViewCompat.setOnApplyWindowInsetsListener(scanner, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });
        return scanner;
    }
}
