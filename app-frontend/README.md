# Blooprr Frontend

This is the mobile frontend for **Blooprr**, a media-and-text social media app built around unscripted, ephemeral moments. It is built using **React Native** and **Expo**.

## Project Structure

This project uses **Expo Router** (file-based routing). All screens and navigation flows are defined by the folder structure inside `src/app/`.

### Directory Overview

- **`/src`**: The core source code directory.
  - **`/src/app`**: Contains all the screens and navigation layouts (Expo Router).
    - `_layout.tsx`: The root navigation layout. Currently uses a simple Stack navigator (`<Stack />`) to manage the onboarding flow seamlessly without headers or tabs.
    - `index.tsx`: The initial screen (Onboarding Screen).
    - `sync.tsx`: The contact synchronization logic screen. Handles reading device contacts and safely hashing them before sending them to the backend.
  - **`/src/components`**: Reusable UI components (like custom animations and styled views).
  - **`/src/constants`**: Global constants, theme colors, and configuration values.
  - **`/src/hooks`**: Custom React hooks.
- **`/assets`**: Static assets like images and custom fonts.
  - **`/assets/images`**: Contains the app logo and other visual assets.
  - **`/assets/fonts`**: Contains custom fonts (e.g., `CalSans.ttf`) loaded during the splash screen in `_layout.tsx`.

## Core Technologies

- **React Native / Expo**: Core framework.
- **Expo Router**: Navigation and routing.
- **expo-font**: Custom font loading (Cal Sans).
- **expo-crypto**: Client-side hashing for privacy-first contact syncing.
- **expo-contacts**: Accessing the device's address book securely.

## Getting Started

1. Ensure the `app-backend` server is running on `http://localhost:3001` (or your local IP).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code with Expo Go on a physical device.
