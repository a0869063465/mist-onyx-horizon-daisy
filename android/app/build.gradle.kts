plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Each build on GitHub gets a higher number, so a new APK installs over the old one.
val build = (System.getenv("VERSION_CODE") ?: "1").toInt()

android {
    namespace = "com.clashofthebeasts.game"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.clashofthebeasts.game"
        minSdk = 24
        targetSdk = 34
        versionCode = build
        versionName = "1.0.$build"
    }

    buildTypes {
        release {
            // Signed afterwards (scripts/apk/sign-apk.py): the key never goes into this public repository.
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}
