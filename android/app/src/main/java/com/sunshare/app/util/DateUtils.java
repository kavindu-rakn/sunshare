/*
 * ============================================================================
 *  File        : DateUtils.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Turns the API's UTC time text (e.g. "2026-09-30T05:30:00Z")
 *                into the phone's local time for display only, e.g.
 *                "Wed, 30 Sep, 11:00". All time rules (7 days, 12 hours) are
 *                worked out by the API, never here (docs/02-ARCHITECTURE.md
 *                section 8).
 * ============================================================================
 */
package com.sunshare.app.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

public final class DateUtils {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("EEE, d MMM, HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH);

    // Only static helpers - nobody needs to create a DateUtils object.
    private DateUtils() {
    }

    // Reads an ISO time from the API and moves it to the phone's time zone. Returns null if the text is empty or unreadable.
    // "...Z" and "+05:30" times are read as they are; a time with no zone at all is taken as UTC (same as the API).
    public static ZonedDateTime toLocal(String isoText) {
        if (isoText == null || isoText.isEmpty()) {
            return null;
        }
        ZoneId phoneZone = ZoneId.systemDefault();
        try {
            return Instant.parse(isoText).atZone(phoneZone);
        } catch (DateTimeParseException notZ) {
            try {
                return OffsetDateTime.parse(isoText).atZoneSameInstant(phoneZone);
            } catch (DateTimeParseException notOffset) {
                try {
                    return LocalDateTime.parse(isoText).atOffset(ZoneOffset.UTC).atZoneSameInstant(phoneZone);
                } catch (DateTimeParseException unreadable) {
                    return null;
                }
            }
        }
    }

    // "Wed, 30 Sep, 11:00" - for booking cards and details.
    public static String formatDateTime(String isoText) {
        ZonedDateTime local = toLocal(isoText);
        return local == null ? "-" : DATE_TIME.format(local);
    }

    // "Wed, 30 Sep 2026" - dates only.
    public static String formatDate(String isoText) {
        ZonedDateTime local = toLocal(isoText);
        return local == null ? "-" : DATE.format(local);
    }

    // "11:00" - times only.
    public static String formatTime(String isoText) {
        ZonedDateTime local = toLocal(isoText);
        return local == null ? "-" : TIME.format(local);
    }

    // "Wed, 30 Sep, 11:00 - 12:00" - a slot or booking window (start date + both times).
    public static String formatRange(String startIso, String endIso) {
        return formatDateTime(startIso) + " - " + formatTime(endIso);
    }
}
