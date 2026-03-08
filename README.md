# OrBox Fit – React Native (Expo)

Mobile app for OrBox Fit, built with React Native and Expo. Mirrors the web app features and UI.

## Setup

```bash
cd mobile
npm install
```

## Configure API

Set your backend API URL for the mobile app (required for device/emulator):

- **Option A**: Create `.env` with:
  ```
  EXPO_PUBLIC_API_URL=https://your-api.com/api
  EXPO_PUBLIC_APP_ID=default
  ```
- **Option B**: In `app.json` → `extra` → set `apiUrl` and `appId` to your values.

The app uses the same API as the web app: `POST /auth/login`, `POST /auth/signup`, `GET /auth/me`, and entity endpoints under `/entities/*`.

## Run

```bash
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Features

- **Auth**: Login, Signup, token in AsyncStorage
- **Main tabs**: Home, Mapa, Reservas, Personais, Histórico, Suporte
- **Booking flow**: ExploreMap → BookBox → BookingConfirmed; BoxSession for active sessions
- **Personais**: List, profile, reviews; PersonalRegister and PersonalDashboard for trainers
- **Admin**: Drawer with Dashboard, Boxes, Reservas, Usuários, Personais, Financeiro (admin role only)
- **UI**: Dark theme (#0a0a0a), accent #f7941d, same copy and structure as web

## Structure

- `App.js` – Root with QueryClient and AuthProvider
- `src/navigation/` – Root stack, Auth stack, Main tabs, Admin drawer
- `src/screens/` – All screens (Login, Home, BookBox, BoxSession, Admin*, etc.)
- `src/api/client.js` – API client (AsyncStorage for token)
- `src/context/AuthContext.js` – Auth state and public settings
- `src/components/` – OrBoxLogo, StatusBadge, BoxCard, QuickStatCard, etc.

## Assets

Add `assets/icon.png`, `assets/splash.png`, and `assets/adaptive-icon.png` for production, or use Expo defaults.
