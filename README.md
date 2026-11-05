# Zawleeya Wedding Invitation

React + Vite wedding invitation with a server-validated Google OAuth Master area, Upstash Redis whitelist, and persistent YouTube music presets.

## Requirements
- Node.js 20+
- Google Cloud OAuth 2.0 Web Client
- Upstash Redis REST database

## Local setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill the values below.
3. Set Google OAuth Authorized redirect URI to `http://localhost:3000/api/auth/callback`.
4. Run `npm run dev` (Vite frontend on port 3000, API on port 3001).
5. Open `http://localhost:3000`. Guests see only the invitation; open `http://localhost:3000/?mode=master` to reach the Master login. The query parameter does not grant access.

## Environment variables
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials.
- `SESSION_SECRET`: random secret, minimum 32 characters.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST credentials.
- `MASTER_EMAILS`: optional comma-separated initial whitelist; copied to Redis only if the Redis whitelist is empty. Use a placeholder locally and replace it with the intended Master email before production.
- `APP_URL`: application origin without trailing slash.
- `API_PORT`: optional local API port (default 3001).

## Whitelist management
The first successful server initialization seeds `wedding:master-whitelist` in Redis from `MASTER_EMAILS` only when that set is empty. After logging in, the Master can use the authenticated endpoints `/api/master/whitelist` (GET), `/api/master/whitelist` (POST `{ "email": "person@example.com" }`) and `/api/master/whitelist/:email` (DELETE). The currently logged-in Master cannot remove their own email. Do not expose Redis tokens or session secrets in client-side variables.

## YouTube presets
In Master Dashboard > Music, paste a YouTube video URL. The server validates the URL, fetches the title and channel name through YouTube oEmbed, then stores the preset in Redis. Presets are listed publicly for the invitation player; create/delete actions require a valid Master session. YouTube playback is subject to the video's embed permissions and YouTube/browser policies.

## Deploy to Vercel
1. Push this project to a new GitHub repository. Do not commit `.env`.
2. Import the repository in Vercel; framework should be detected as Vite.
3. Add all production environment variables from `.env.example` in Vercel Project Settings > Environment Variables. Set `APP_URL` to the production origin, for example `https://your-project.vercel.app`.
4. In Google Cloud Console, add `https://your-project.vercel.app/api/auth/callback` as an Authorized redirect URI. Also add the local redirect URI for local development.
5. Deploy. Verify a non-whitelisted Google account is rejected and the approved account can access Master.

## Security notes
- The frontend never treats `?mode=master` as authentication. The API validates the signed, HttpOnly session cookie and re-checks the Redis whitelist on each Master request.
- This update protects the Master interface and its APIs. Existing invitation content and RSVP/config state still use the app's original localStorage storage model; those settings are browser-local and are not automatically synchronized across guests/devices. Move wedding content and RSVP persistence to Redis in a separate follow-up if you want all guests to see the same Master-edited content.
- Do not store secrets in `VITE_*` variables.

## Mode Lamaran Zaky & Aulia

Aplikasi ini dikonfigurasi untuk acara lamaran pada Minggu, 27 Desember 2026 di The Sunday Cafe Purwakarta. Master dapat membuat undangan individual dengan nama dan kuota orang. Setiap link memiliki token unik dan respons RSVP tersimpan di Upstash Redis.

Alur RSVP: tamu memilih Hadir atau Tidak Hadir. Jika Hadir, tamu wajib memilih satu dari enam menu untuk setiap orang sesuai kuota undangan. Master dapat memantau status dan pilihan konsumsi melalui tab RSVP.

Endpoint undangan menggunakan Redis yang sama dengan konfigurasi aplikasi:
- `POST /api/master/invitations` — membuat link undangan (Master only)
- `GET /api/master/invitations` — melihat daftar undangan dan pilihan menu (Master only)
- `GET /api/invitations/:token` — mengambil identitas dan kuota undangan
- `POST /api/invitations/:token/rsvp` — menyimpan konfirmasi dan pilihan menu

## Scroll reveal animations

Guest-facing sections now use Motion's viewport-based reveal transitions. Text blocks, profile cards, gallery images, event details, RSVP content, and the closing section fade in with a subtle upward movement as visitors scroll. Animations run once per element, use staggered delays for image grids, and retain the existing hover/lightbox interactions and responsive layouts.
