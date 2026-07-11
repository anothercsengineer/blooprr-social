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
