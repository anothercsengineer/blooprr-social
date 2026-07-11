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
