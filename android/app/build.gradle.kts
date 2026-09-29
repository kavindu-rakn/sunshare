// File: app/build.gradle.kts | Part B (Android shell) | Build settings and libraries of the SunShare Android app.
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

// Read local.properties (never committed to git) so the Google Maps key stays private.
val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) {
        file.inputStream().use { load(it) }
    }
}

android {
    namespace = "com.sunshare.app"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.sunshare.app"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        // ${MAPS_API_KEY} in AndroidManifest.xml is replaced by the key from local.properties (empty if missing).
        manifestPlaceholders["MAPS_API_KEY"] = localProperties.getProperty("MAPS_API_KEY", "")
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    // Template defaults
    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.material)
    // Lists (bookings)
    implementation(libs.recyclerview)
    // Calling the SunShare API: Retrofit + Gson (JSON <-> Java objects)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    // QR codes: make (prosumer) and scan (operator)
    implementation(libs.zxing.android.embedded)
    // The phone's location for the nearby stations map (the map itself is Google's JavaScript API in a WebView, D53)
    implementation(libs.play.services.location)
}
