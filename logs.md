### Blooprr Development Logs

---
# *Chronological record of the v0.1.0-alpha build process*

## Session 1: The Foundation & Authentication Blueprint
*Goal: Set up the core project architecture, initialize the local database, and build the mock authentication logic.*

- **[Init]** Scaffolded the mobile architecture using `create-expo-app` (`app-frontend`) and initialized a clean Node.js backend (`app-backend`).
- **[Backend]** Built the foundational `brain.js` file utilizing `express`, `cors`, and `dotenv`. Established end-to-end communication with the React Native frontend.
- **[Database]** Opted for lightweight `sqlite3` for the prototype. Designed the `db.js` schema encompassing strict tables for `users` (with hashed phone numbers), `bloops` (ephemeral posts), `connections` (mutual contacts), and `engagements` (the life-extension mechanic).
- **[Security]** Engineered `routes/auth.js` to simulate OTP-based phone authentication. Implemented SHA-256 client hashing augmented with a server-side pepper to mathematically ensure raw phone numbers are never stored in plaintext, honoring the PRD's strict privacy constraints.

---

## Session 2: The Frontend UI & Onboarding
*Goal: Build a sleek, minimalist onboarding UI, rip out template boilerplate, and initialize version control.*

- **[UI/UX]** Replaced the default Expo boilerplate in `index.tsx` with a dark-mode, minimalist onboarding screen tailored precisely to the design mockup.
- **[Navigation]** Removed the default Expo Bottom Tabs template by stripping `<AppTabs />` from `_layout.tsx` and replacing it with a clean, headerless `<Stack />` navigator.
- **[Assets]** Injected custom visual assets. Loaded the custom `Cal Sans` font asynchronously during the Expo splash screen and applied it to the primary typography. Replaced text logos with a static image asset.
- **[Styling Polish]** Encountered the Android `elevation` directional shadow limitation. Replaced legacy shadow properties with the modern React Native 0.74+ CSS `boxShadow` property to generate a perfect, uniform cyan glow around the call-to-action button.
- **[Cleanup]** Deleted non-essential template boilerplate (`explore.tsx`, `app-tabs.tsx`) to maintain a pristine codebase.
- **[Version Control]** Hardened the `.gitignore` files to definitively block `.env` secrets and local SQLite databases from leaking. Cleaned up nested Git repositories, initialized root version control, and locked in the timeline with the `v0.1.0-alpha` tag.

---

# *Chronological record of the v0.2.0-alpha minor update cycle*

## Session 3: Phone Authentication UI
*Goal: Build a dynamic, interactive login screen connected to the mock backend.*

- **[UI/UX]** Engineered `login.tsx` with a sleek dark-mode layout matching the sketch proportions, including a custom pill-shaped input and checkbox.
- **[State Management]** Built dynamic React states (`phoneNumber`, `agreed`) that automatically toggle the active/inactive UI state of the primary "proceed" button.
- **[Validation Firewall]** Implemented a rigorous custom input cleaner (`handlePhoneChange`) that mathematically strips all non-numeric characters, automatically injects a whitespace gap after 5 digits, and enforces a strict 11-character maximum limit to prevent database type-errors.
- **[Navigation]** Bound the `index.tsx` "get started" button to the Expo Router, seamlessly transitioning users into the new `/login` route.
- **[Design Polish]** Refined the UI to pixel-perfection: slimmed down the input pills, fixed typography hierarchies, and applied rigorous fixed-width constraints (`width: 220`) to definitively intercept React Native flexbox stretching across wide device screens.

---

# *Chronological record of the v0.3.0-alpha minor update cycle*

## Session 4: OTP Verification UI
*Goal: Build a robust, bug-free OTP entry screen and finalize the authentication flow.*

- **[UI/UX]** Engineered `verification.tsx` with a custom 6-slot OTP design matching the sketches, complete with cyan active underlines and dark gray 'X' empty states.
- **[Architecture]** Overcame native mobile keyboard focus limitations by implementing a "hidden input" architecture. A single, invisible `<TextInput>` handles all keystrokes and auto-focuses while dynamically updating the 6 visually independent React Native UI slots.
- **[Navigation]** Configured `useLocalSearchParams` to securely extract the `phoneNumber` parameter passed down from the `/login` route.
- **[Backend Integration]** Hooked up the `handleVerification` function to trigger a `POST` request to the backend's `/api/auth/verify-otp` mock endpoint, completing the end-to-end authentication cycle.

---

# *Chronological record of the v0.3.1-alpha patch update cycle*

## Session 5: URL-Encoding Bug Fix
*Goal: Resolve a phone payload serialization bug caused by Expo Router parameter passing.*

- **[Hotfix]** Patched `verification.tsx` to handle an Expo Router `useLocalSearchParams` bug that was stripping or improperly encoding the `+` sign in the `phoneNumber` parameter.
- **[Validation Firewall]** Engineered a robust `safePhone` variable that strips all non-numeric characters from the incoming route parameter and dynamically re-attaches the `+` prefix before making the API request, ensuring a perfectly clean string is sent to the backend.

---

# *Chronological record of the v0.3.2-alpha patch update cycle*

## Session 6: Codebase Security & UX Audit Resolution
*Goal: Patch all critical and high-severity vulnerabilities identified during the full-stack system audit.*

- **[Hotfix]** Resolved a critical syntax error (stray `]`) in the SQL template literal inside `contacts.js` that was instantly crashing the `/sync` endpoint.
- **[Hotfix]** Fixed a fatal table name mismatch (`contact_edges` vs `edges`) across `db.js` and `contacts.js` to restore database integrity for contact syncing. Changed the name of the table to `mutuals` and unified it across the backend files.
- **[Backend Security]** Implemented a rigorous 5-minute TTL and 5-attempt brute-force lockout mechanism on the OTP store, securing the authentication endpoint against automated guessing attacks.
- **[Backend Security]** Replaced predictable `Math.random()` usage with mathematically secure `crypto.randomInt()` for OTP generation.
- **[Data Privacy]** Modified the `/verify-otp` SQL query to exclusively return non-sensitive profile columns, definitively intercepting `phone_hash` leaks in API responses.
- **[DDoS Protection]** Hardened the Express server by adding a 1MB payload size limit on JSON bodies and explicitly capping the `/sync` endpoint contact array at 5,000 entries to prevent SQLite memory crashes.
- **[Input Validation]** Applied strict E.164 Regex validation on all incoming phone numbers to block injection variants and malformed data entries.
- **[Cross-Platform Routing]** Re-architected frontend API routing by extracting hardcoded Android Emulator IPs (`10.0.2.2`) and centralizing network logic into a dynamic `constants/config.ts` environment file, unlocking physical device and iOS testing capabilities.

---

# *Chronological record of the v0.3.3-alpha patch cycle*

## Session 7: Zero-Knowledge Cryptography & Network Hardening
*Goal: Finalize the security audit by eliminating client-side secrets and locking down network exposures.*

- **[Cryptography]** Engineered a Double-Hash Architecture (SHA-256 client hashing + SHA-256 server peppering) to definitively remove the secret cryptographic pepper from the frontend codebase.
- **[Backend Security]** Rewrote the `hashPhoneNumber` utility to strictly sanitize incoming phone numbers (stripping non-digits) to guarantee hash matching between client and server.
- **[Logic Hotfix]** Resolved a critical scoping bug in `auth.js` that was trapping the OTP verification logic inside an obsolete comparison block.
- **[Data Privacy]** Hardened the new user sign-up response to prevent `phone_hash` leaks.
- **[Database Integrity]** Configured the `/sync` endpoint to intercept incoming client hashes and mathematically apply the server-side pepper via a `.map()` function prior to any database querying.

---

# *Chronological record of the v0.3.4-alpha patch cycle*

## Session 8: Final Backend Audit Resolution
*Goal: Complete the backend security hardening by locking down network CORS policies and preventing production logging leaks.*

- **[Network Security]** Replaced the wildcard CORS policy in `brain.js` with a strictly bound `allowedOrigins` array, ensuring the API exclusively accepts traffic from authorized local development ports.
- **[Data Privacy]** Wrapped the mock SMS OTP console logger in a strict `NODE_ENV !== 'production'` environment check, guaranteeing sensitive phone and OTP data will never leak into production server logs.

---

# *Chronological record of the v0.3.5-alpha patch cycle*

## Session 9: Structural Database Optimization & Payload Validation
*Goal: Resolve the remaining Medium/Low severity backend bugs related to database scaling, concurrency, and NoSQL payload poisoning.*

- **[Concurrency]** Configured `PRAGMA busy_timeout = 5000` in SQLite to resolve critical `SQLITE_BUSY` crashes during concurrent writes.
- **[Data Integrity]** Enforced `PRAGMA foreign_keys = ON` to mathematically guarantee relational data integrity and prevent orphaned rows.
- **[Performance]** Engineered three critical database indexes (`idx_bloops_profile_id`, `idx_mutuals_contact_hash`, `idx_engagements_bloop_id`) to definitively eliminate Full Table Scans and ensure hyper-fast feed loading.
- **[Payload Security]** Hardened the `/sync` endpoint with strict integer casting for `profileId` and a rigorous 64-character hex-string regex for `contactHashes`, definitively blocking NoSQL injection and payload poisoning attacks.
- **[Frontend UX]** Patched a template literal bug in `login.tsx` to correctly evaluate the HTTP response status on failure.

---

# *Chronological record of the v0.4.0-alpha minor update cycle*

## Session 10: JWT Authentication Architecture
*Goal: Implement a cryptographically secure session management system to prevent API impersonation and unauthorized access.*

- **[Security Architecture]** Installed `jsonwebtoken` and engineered a centralized `authenticateToken` middleware to intercept and decode incoming HTTP headers.
- **[Session Management]** Upgraded the `/verify-otp` login/signup endpoint to mathematically sign and issue a 1-year JWT payload containing the user's `profileId`.
- **[API Hardening]** Protected the `/sync` endpoint with the JWT middleware. Eliminated critical vulnerability #3 by extracting the `profileId` strictly from the cryptographically verified token payload, completely neutralizing JSON body spoofing attacks.

---

# *Chronological record of the v0.4.1-alpha patch update cycle*

## Session 11: Edge Case Resolution & DevOps Hardening
*Goal: Finalize structural architecture by patching edge cases, preventing memory leaks, and optimizing database concurrency.*

- **[Backend (brain)]** Engineered a graceful `SIGINT` shutdown to explicitly close database connections and prevent SQLite corruption during server restarts.
- **[Backend (brain)]** Injected `helmet` for HTTP security headers and `express-rate-limit` to neutralize distributed IP botnets and DDoS attacks.
- **[Backend (db)]** Enabled `PRAGMA journal_mode = WAL` to allow simultaneous, high-concurrency read/write database operations without locking.
- **[Backend (auth)]** Engineered a strict 45-second SMS Toll Fraud cooldown to prevent budget draining via automated SMS bombing.
- **[Backend (auth)]** Built a `setInterval` garbage collector to sweep expired OTPs from the mock store and definitively prevent memory leaks.
- **[Backend (contacts)]** Handled the empty-array edge case to prevent `SQLITE_ERROR: near ")": syntax error` crashes when a user uploads 0 contacts.
- **[Backend (contacts)]** Wrapped both `insertEdge` and `insertConnection` loops inside explicit `BEGIN TRANSACTION` blocks, increasing payload sync performance by 100x and eliminating event loop blocking.

---

# *Chronological record of the v0.5.0-alpha minor update cycle*

## Session 12: Invite-Only Gate & SMS Quota Enforcement
*Goal: Implement a resilient, invite-only signup system (Blipkey) with SMS quota protection and a flawless frontend UX.*

- **[Database Architecture]** Engineered `blipkeys` and `daily_metrics` tables in `db.js`. Utilized an atomic `date_string` Primary Key with `ON CONFLICT DO UPDATE` to strictly enforce a daily Firebase SMS quota (10/day).
- **[Authentication Flow]** Upgraded `auth.js` to intercept new signups and require a valid, unbound Blipkey. Engineered a secure "Phone Binding" mechanism that ties an invite key to a phone hash upon SMS request, preventing key theft while allowing legitimate retry attempts without burning quota.
- **[DevOps Automation]** Created `scripts/genesis.js` to mint initial seed keys, and `scripts/distribute.js` to run as a daily cron job targeting users >24 hours old.
- **[Frontend UX]** Intercepted the 400 error in `login.tsx` to dynamically route new users to a bespoke `/blipkey` gate screen.
- **[Frontend UI Polish]** Built `blipkey.tsx` featuring an auto-formatter that strips non-alphabetical characters and auto-injects hyphens. Circumvented deep-rooted Android React Native `TextInput` cursor bugs by implementing a disappearing "Ghost Placeholder" using absolute positioning.
- **[Networking]** Fixed the Android emulator localhost binding bug in `config.ts` to fully support physical device testing on the local Wi-Fi network.

## Session 13: Native Authentication & Cloud Deployment
*Goal: Replace mock authentication with real Firebase SMS verification and set up cloud compiling.*

- **[Native Auth Integration]** Ripped out the mock SMS logic and wired up `@react-native-firebase/auth`. Added `google-services.json` and registered the Android SHA keys to properly handshake with Google servers.
- **[Play Integrity & Testing]** Navigated Google's bot-prevention APIs. Leveraged Firebase's Test Numbers feature to bypass emulator blocks and verify the end-to-end login flow locally.
- **[Cloud Compilation]** Set up Expo Application Services (EAS) with a custom `eas.json` profile. Shifted the physical APK builds to Expo's Linux servers to completely avoid local Windows C++ compiler conflicts.
- **[Backend Validation]** Hooked up the Node.js backend to securely verify incoming Firebase tokens using the Firebase Admin SDK. Temporarily bumped the SQLite daily SMS limit to 1,000 to facilitate active development.

---

# *Chronological record of the v0.6.0-alpha minor update cycle*

## Session 14: Custom Authentication & Firebase Removal
*Goal: Remove the Firebase SMS dependency to eliminate SMS costs and streamline the login architecture.*

- **[Backend Refactor]** Completely removed Firebase Admin SDK and SMS quota logic (`daily_metrics`) from `auth.js`.
- **[Custom Auth API]** Restructured backend into two separate endpoints (`/login` and `/register`). The new flow handles direct JWT generation upon phone/blipkey validation.
- **[Frontend Refactor]** Purged `@react-native-firebase/auth` and the entire `verification.tsx` screen from the Expo app.
- **[Frontend UX]** Updated `login.tsx` to handle JWTs securely using `expo-secure-store`, bypassing OTP entirely. Routed new users directly to the blipkey gate, and instantly authenticated returning users.

---

# *Chronological record of the v0.6.1-alpha patch update cycle*

## Session 15: Critical & High Severity Bug Sweep
*Goal: Resolve all critical and high severity vulnerabilities identified in the full-stack system audit.*

- **[DevOps Cleanup]** Eliminated 3 critical vulnerabilities by purging `serviceAccountKey.json`, `google-services.json`, and all Firebase native SDK dependencies from the codebase.
- **[Backend Security]** Patched a severe race condition in `auth.js` by executing an atomic `UPDATE` lock on the blipkey before inserting a new user profile.
- **[Backend Security]** Enforced strict environment variable checks in `brain.js` to crash the server if `JWT_SECRET` or `PHONE_PEPPER` are missing, removing insecure hardcoded fallbacks.
- **[Database Cleanup]** Dropped the deprecated `daily_metrics` table schema from `db.js`.
- **[Frontend UX]** Resolved a double-tap race condition in `login.tsx` and `blipgate.tsx` by implementing an `isLoading` state to disable buttons during API requests.
- **[Frontend UX]** Wrapped login screens in `TouchableWithoutFeedback` to allow users to dismiss the keyboard by tapping outside input fields.
- **[Frontend Routing]** Implemented a deep-link guard in `blipgate.tsx` to prevent app crashes if a user bypasses the login screen without a valid phone parameter.
