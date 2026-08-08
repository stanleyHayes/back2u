# bak2me Mobile — App Store & Play Store Compliance

Status of store-readiness for `apps/client-mobile` (Expo / React Native). Items marked
**[code ✓]** are done in this repo; **[you]** are console/account steps only you can do.

---

## Done in code (this repo)

- **App icons & splash** [code ✓] — real 1024×1024 assets generated from the brand mark
  (`assets/icon.png` no-alpha for iOS, `assets/adaptive-icon.png` transparent foreground for
  Android + `#2E3D2F` background, `assets/splash.png`, `assets/notification-icon.png` white
  silhouette for Android status bar, `assets/favicon.png`). Regenerate with
  `scripts` in the commit that added them, or re-run `rsvg-convert` on the source SVGs.
- **Versioning** [code ✓] — `version: 1.0.0`, `ios.buildNumber: "1"`, `android.versionCode: 1`.
- **Encryption / export compliance** [code ✓] — `ios.config.usesNonExemptEncryption: false`
  and `ITSAppUsesNonExemptEncryption: false` (skips the manual export-compliance question).
- **iOS permission usage strings** [code ✓] — camera, photo library, and **when-in-use**
  location (we removed “Always” location to avoid extra review scrutiny — we only use
  location while the app is open).
- **iOS privacy manifest** [code ✓] — `ios.privacyManifests` declares required-reason APIs
  (UserDefaults, file timestamp, system boot time, disk space) that Expo/RN use.
- **Android permissions** [code ✓] — scoped to CAMERA, FINE/COARSE_LOCATION,
  READ_MEDIA_IMAGES, POST_NOTIFICATIONS; **blocked** background-location, audio and legacy
  storage so they never leak into the manifest.
- **Account deletion in-app** [code ✓] — Settings → “Delete account” (Apple 5.1.1(v) &
  Google’s in-app deletion requirement). Irreversible, confirmed with a dialog.
- **Data export in-app** [code ✓] — Settings → “Export data”.
- **Privacy Policy & Terms links in-app** [code ✓] — Settings → “Legal” opens
  `${EXPO_PUBLIC_WEBSITE_URL}/privacy` and `/terms` (defaults to `https://bak2me.com`).
- **EAS build/submit config** [code ✓] — `eas.json` (development / preview / production
  profiles + submit credentials placeholders).

---

## Before you can submit

### 1. EAS / build setup [you]

```bash
cd apps/client-mobile
npm i -g eas-cli
eas login
eas init                       # creates the project, writes extra.eas.projectId
eas build:configure
# Set EXPO_PUBLIC_API_URL per profile in eas.json to your Render API URL.
eas build -p ios --profile production
eas build -p android --profile production
```

Fill the `submit.production` placeholders in `eas.json` (Apple ID, App Store Connect app id,
Apple team id; Google Play service-account JSON), then `eas submit -p ios|android`.

### 2. Publish the legal pages [you]

The in-app Legal links point at the marketing site. Make sure these are live and reachable:

- `https://bak2me.com/privacy` — must describe **what data is collected, why, retention, and
  how to request deletion**, plus a contact email.
- `https://bak2me.com/terms`.
- **Google Play also requires a web URL to request account deletion.** Either the privacy page
  explains it, or add a dedicated `/delete-account` page. (In-app deletion alone is not enough
  for Play — it wants a URL reachable without installing the app.)

### 3. App Store Connect — App Privacy (“nutrition labels”) [you]

Declare data collected, all **linked to the user**, **used for App Functionality**, **not used
for tracking**:

| Category                 | Examples in bak2me                               |
| ------------------------ | ------------------------------------------------ |
| Contact Info             | email, name, phone (optional)                    |
| User Content             | item photos, chat messages                       |
| Location                 | coarse + precise, **while using the app**        |
| Identifiers              | account/user id                                  |
| Usage Data & Diagnostics | app interactions, crash logs (if Sentry enabled) |

Also: age rating questionnaire, screenshots (6.7″ & 6.5″ iPhone, plus 12.9″ iPad since
`supportsTablet: true`), description, keywords, **support URL**, **marketing URL**,
**privacy policy URL**.

### 4. Google Play Console — Data safety [you]

Fill the Data safety form to match the table above (Personal info, Photos, Location, App
activity; encrypted in transit; deletion available). Add: content rating questionnaire,
privacy policy URL, store listing (phone + 7″/10″ tablet screenshots, **feature graphic
1024×500** — see `assets/store/`, **512×512 hi-res icon** — see `assets/store/`), and target
audience.

### 5. Sign-in for reviewers [you]

Both stores require working demo credentials for a login-gated app. Provide, in App Review
notes / Play “App access”:

```
Email:    ama@bak2me.com
Password: Back2u-Demo-2026!
```

(Point the review build’s `EXPO_PUBLIC_API_URL` at a live API that has this account seeded.)

---

## Store-listing assets (generated)

- `assets/store/play-icon-512.png` — Google Play hi-res icon (512×512).
- `assets/store/feature-graphic-1024x500.png` — Google Play feature graphic.

Screenshots are not generated here — capture them from a device/simulator running the
production build.
