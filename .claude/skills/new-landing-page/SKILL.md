# Skill: new-landing-page

**Trigger**: User asks to create / scaffold a new standalone web app or "try" page in this monorepo.

---

## Project Scaffold

Mirror the structure of `frontend/simplify/`:

```
frontend/<app-name>/
  src/
    App.tsx          # sole entry point
    App.css          # all styles (pure CSS — no Tailwind)
    api/
      firebase.ts    # auth + API URL helpers
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .env.local         # local dev env vars (git-ignored)
  .env.production    # production env vars
```

**Stack**: Vite + React 19 + TypeScript
**Styling**: Pure CSS in `App.css` (no Tailwind — project convention)
**Font**: Inter from Google Fonts (`<link>` in `index.html`)
**Routing**: None needed for single-page tools — `App.tsx` is the full app

---

## Firebase Config (public — safe to bundle)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_PROCESSING_URL
```

Copy values from `frontend/simplify/.env.local` or `frontend/landing/.env.local` — they share the same Firebase project.

---

## Guest Auth — Custom Token Flow (the "try" pattern)

**Do NOT use email/password credentials in VITE vars** — these are visible in the JS bundle.

Instead, use the backend custom-token pattern:

```
Frontend                              Backend
  |  GET /feature/token  (no auth)      |
  | ──────────────────────────────────► | create_custom_token(SIMPLIFY_GUEST_UID)
  | ◄────────────────────────────────── | → { token: "..." }
  |                                     |
  | signInWithCustomToken(token)         |
  | → Firebase User → ID token          |
  |                                     |
  |  POST /feature                      |
  |  Authorization: Bearer <id_token>   |
  | ──────────────────────────────────► | verify_firebase_token (unchanged)
```

### Frontend — `src/api/firebase.ts` canonical pattern

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const API_URL = import.meta.env.VITE_API_PROCESSING_URL;

export async function signInAsGuest(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const res = await fetch(`${API_URL}/feature/token`);
  if (!res.ok) throw new Error('Could not obtain session token');
  const { token } = await res.json() as { token: string };
  const cred = await signInWithCustomToken(auth, token);
  return cred.user;
}

export async function getAuthToken(): Promise<string> {
  let user = auth.currentUser;
  if (!user) user = await signInAsGuest();
  return user.getIdToken();
}
```

### Backend — `routes/<feature>.py` canonical pattern

```python
import os
import firebase_admin.auth
from flask import jsonify, Blueprint
from utils.auth import verify_firebase_token

feature_bp = Blueprint("feature", __name__)

@feature_bp.route("/feature/token", methods=["GET"])
def feature_token():
    uid = os.environ.get("SIMPLIFY_GUEST_UID")   # reuse shared guest UID
    if not uid:
        return jsonify({"error": "Service not configured"}), 503
    custom_token = firebase_admin.auth.create_custom_token(uid)
    return jsonify({"token": custom_token.decode()})

@feature_bp.route("/feature", methods=["POST"])
@verify_firebase_token
def feature_handler(user_id: str):
    ...
```

**Required env var**: `SIMPLIFY_GUEST_UID` — already set for the simplify tool. Reuse it.
It is the UID of `juno-guest-production-user-try@gmail.com` (Firebase Console → Authentication → Users).

### Register the blueprint in `app.py`

```python
from routes.feature import feature_bp
app.register_blueprint(feature_bp)
```

### Local dev — corporate network / VPN bypass

If `www.googleapis.com` is blocked, add to backend `.env`:
```
ALLOW_UNAUTHENTICATED=true
FLASK_DEBUG=1
```
This triggers `_DEV_BYPASS` in `utils/auth.py`. **Never set in production.**

---

## Firebase Hosting Deployment Wiring

### 1. `frontend/firebase.json` — add an entry in the `"hosting"` array

```json
{
  "target": "<site-alias>",
  "public": "<app-folder>/dist",
  "ignore": ["firebase.json", "**/.*", ".env.*"],
  "rewrites": [{ "source": "**", "destination": "/index.html" }]
}
```

### 2. `frontend/.firebaserc` — add alias under `targets.<project-id>.hosting`

```json
"<site-alias>": ["<firebase-site-id>"]
```

The `<firebase-site-id>` is the Firebase Hosting site name (e.g. `medical-scribe-simplify`). Create it first in Firebase Console → Hosting → Add site.

### 3. `.github/workflows/firebase-hosting-merge.yml` — add a deploy job

Mirror the existing `app` and `landing` deploy steps, triggered on branch `deploy-<site-alias>`:

```yaml
- name: Deploy <site-alias> to Firebase Hosting
  if: github.ref == 'refs/heads/deploy-<site-alias>'
  run: |
    cd frontend/<app-folder>
    npm ci
    npm run build
    cd ..
    firebase deploy --only hosting:<site-alias> --token "$FIREBASE_TOKEN"
```

---

## Checklist for a New App

- [ ] Scaffold `frontend/<app-name>/` mirroring `frontend/simplify/`
- [ ] Copy Firebase env vars from an existing `.env.local`
- [ ] Implement `src/api/firebase.ts` with `signInAsGuest` / `getAuthToken`
- [ ] Add backend Blueprint with `/token` endpoint + authenticated handler
- [ ] Register blueprint in `app.py`
- [ ] Add entry to `frontend/firebase.json`
- [ ] Add alias to `frontend/.firebaserc`
- [ ] Add deploy step to `.github/workflows/firebase-hosting-merge.yml`
- [ ] Add `SIMPLIFY_GUEST_UID` to backend Cloud Run env vars (already present — verify)
