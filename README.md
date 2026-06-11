# ForestCRM Mobile

A field-sales companion app for [Perfex CRM](https://www.perfexcrm.com/), built with Expo / React Native. Its core workflow is **call-driven lead management**: the app detects phone calls with known leads, shows who is calling, and pops a follow-up sheet after every call so notes and reminders land in the CRM while the conversation is still fresh.

## Features

- **Leads** — searchable, filterable list (status, source, staff, lost/junk, sort), lead detail with notes, reminders, attachments, activity log, custom fields (typed widgets), create/edit, mark lost/junk.
- **Call workflow** — incoming-call lead matching with an in-app caller banner, post-call popup for notes + follow-up reminders, automatic minimal call logging when the popup is skipped, and a persisted call history screen.
- **Offline-first saves** — notes/reminders written right after a call are queued locally when there is no connectivity and synced automatically on reconnect.
- **Reminders & calendar** — quick presets or custom dates, local phone notifications at the due time, calendar tab with day agenda that links back to leads.
- **Estimates** — list, detail, send, status changes, comments.
- **Misc** — dashboard with stats and recently-viewed leads, push + in-app notifications (persisted), profile screen, optional biometric app lock, dark mode (follows the system scheme at launch).

## Tech stack

Expo SDK 56 · React Native 0.85 · React 19.2 · expo-router · TanStack Query · zustand (+ AsyncStorage persistence) · react-native-paper · axios.

The backend is a Perfex CRM custom API module (see `LEADS_API.md` for the lead endpoints and `constants/config.ts` for the base URL).

## Getting started

```bash
npm install
npm start          # Expo dev server
```

> **A development build is required for the full feature set.** Call detection (`react-native-call-detection`) and biometric unlock (`expo-local-authentication`) are native modules that are not part of Expo Go — in Expo Go those features disable themselves with a console warning. Build with:
>
> ```bash
> npx expo run:android   # or: eas build --profile development
> ```

### Mock mode

Set `MOCK_MODE = true` in `constants/config.ts` to run against an in-memory mock server (1000 generated leads, working auth/notes/reminders) instead of the live CRM. Guarded by `__DEV__` — it can never activate in a release build.

### Tests & checks

```bash
npm test           # jest unit tests (run in a UTC-negative TZ on purpose —
                   # it pins a date-parsing regression)
npx tsc --noEmit   # type check
```

CI (`.github/workflows/ci.yml`) runs the type check, the test suite, and a full Android Hermes bundle compile on every push/PR.

## Project layout

```
app/                 expo-router screens ((auth), (tabs), lead/, estimate/, calls, profile, notifications)
components/          UI components (PostCallModal, IncomingCallBanner, CustomFieldInput, ...)
services/            API clients & domain services (perfexApi axios client, leadsService, callDetectionService, ...)
hooks/               TanStack Query hooks
store/               zustand stores (auth, call, call log, notifications, recent leads)
utils/               pure logic (phone matching, date formatting, offline outbox, reminder presets) + tests
constants/           config (API URL, mock mode) and theme (light/dark palettes)
```

### Notes on the API client (`services/perfexApi.ts`)

The CRM sits behind CodeIgniter CSRF protection and its endpoints parse request bodies inconsistently (some read `$_POST`, some read raw JSON — e.g. `/lead_note`). The axios client therefore:

- fetches/refreshes the CSRF token and attaches it (form field, cookie, and `X-CSRF-TOKEN` header as appropriate),
- form-encodes write bodies by default, with per-request JSON opt-in (`_bodyEncoding: 'json'`),
- replays a request once on 403 (stale CSRF token) and once on 400 with the alternate body encoding.

## Before releasing — outstanding setup

1. **`app.json`**: replace the placeholder EAS `projectId` and the `com.yourcompany.mobileapp` iOS/Android identifiers. Push notifications will not work in store builds until then.
2. **Rebuild natives**: the manifest now includes `READ_CALL_LOG` (caller number on Android 9+) and biometric permissions — a new dev/EAS build is required; JS-only changes ship via update.
3. **On-device smoke test** after the SDK 56 upgrade — especially call detection on Android (old library, new RN architecture).
4. Confirm `/lead_note_update` and `/lead_note_delete` exist on the CRM (used by note editing, but undocumented in `LEADS_API.md`).
