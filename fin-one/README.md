# FIN-ONE — Full Stack Setup

This adds a Node.js + Express + MySQL backend to your FIN-ONE frontend. Users can
now register, log in, and have their currency conversions and tax calculations
saved to a real database instead of disappearing on refresh.

```
fin-one/
├── backend/           Node/Express API + MySQL
│   ├── config/db.js       MySQL connection pool
│   ├── middleware/auth.js JWT auth check
│   ├── routes/auth.js     register/login
│   ├── routes/conversions.js
│   ├── routes/tax.js
│   ├── schema.sql         run this to create the database
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    └── FIN-ONE.html   your original UI + login modal + API calls
```

## 1. Set up MySQL

Install MySQL (or MariaDB) locally if you don't have it, then create the database:

```bash
mysql -u root -p < backend/schema.sql
```

This creates a `fin_one` database with three tables: `users`, `conversions`,
`tax_calculations`.

**Recommended:** don't run the app as `root`. Create a dedicated user:

```sql
CREATE USER 'finone'@'localhost' IDENTIFIED BY 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON fin_one.* TO 'finone'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Configure and run the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
- `DB_USER` / `DB_PASSWORD` — the MySQL user you created above
- `JWT_SECRET` — replace with a long random string (e.g. `openssl rand -hex 32`)
- `CORS_ORIGIN` — the URL(s) your frontend will be served from

Install and start:

```bash
npm install
npm start          # or: npm run dev  (auto-restarts on changes, needs nodemon)
```

You should see:
```
✅ MySQL connected: fin_one
🚀 FIN-ONE backend running on port 5000
```

Test it: `curl http://localhost:5000/api/health` → `{"status":"ok",...}`

## 3. Run the frontend

`frontend/FIN-ONE.html` is a static file — open it directly in a browser, or
serve it (e.g. `npx serve frontend`, or VS Code's Live Server). It talks to
`http://localhost:5000/api` automatically when running on localhost.

Click the **Login** chip top-right to sign up, then use the currency converter
or tax calculator — results now sync to MySQL, and reload when you log back in
from any device.

If the backend isn't running, the app still works exactly as before (guest
mode, in-memory history) — it just won't persist.

## 4. What was added, concretely

- **Auth**: `/api/auth/register`, `/api/auth/login` — bcrypt-hashed passwords,
  JWT tokens (7 day expiry by default).
- **Conversions**: `POST /api/conversions` saves a conversion for the logged-in
  user; `GET /api/conversions` returns their last 20; `DELETE /api/conversions`
  clears them. All require a valid `Authorization: Bearer <token>` header.
- **Tax calculations**: `POST /api/tax` / `GET /api/tax`, same pattern.
- Frontend now stores the JWT in `localStorage` and attaches it to requests;
  a login/signup modal was added; history sections show a sync status badge.

## 5. Deploying

A common, cheap setup:

| Piece | Good options |
|---|---|
| Backend (Node/Express) | Render, Railway, Fly.io, a small DigitalOcean/AWS Lightsail VM |
| MySQL database | PlanetScale, Railway MySQL, Aiven, AWS RDS, or MySQL on the same VM |
| Frontend (static HTML) | Netlify, Vercel, GitHub Pages, Cloudflare Pages, or served by the same backend/VM |

General steps, regardless of provider:

1. **Push this project to a Git repo** (GitHub/GitLab) — most hosts deploy from a repo.
2. **Provision MySQL first**, get its host/port/user/password, and run `schema.sql`
   against it (most managed MySQL dashboards have a "connect" or SQL console option,
   or use `mysql -h <host> -u <user> -p < schema.sql`).
3. **Deploy the backend**, setting the same environment variables from `.env` in
   your host's dashboard (never commit `.env` — it's already something you should
   add to `.gitignore`). Set `CORS_ORIGIN` to your real frontend URL once you know it.
4. **Deploy the frontend** as a static site. Update `API_BASE` in the `<script>`
   of `FIN-ONE.html` to point at your live backend URL (the code already falls
   back to `/api` for any non-localhost host — if you serve frontend and backend
   from the same domain behind a reverse proxy, that works with no change; if
   they're on different domains, set the URL explicitly).
5. Use **HTTPS** on both — most of the hosts above provide this automatically.

Once you pick a host (e.g. Railway, Render, etc.) I can walk through that
provider's exact deploy steps with you.

## Security notes for production

- Rotate `JWT_SECRET` to something long and random; never reuse the example value.
- Consider moving the JWT out of `localStorage` into an `httpOnly` cookie if you
  want protection against XSS token theft (would need a small backend change to
  set cookies and a CSRF strategy).
- The backend already rate-limits `/api/auth/*` (30 req / 15 min per IP) to slow
  down brute-force attempts — tune as needed.
- Add HTTPS-only, and set `secure: true` on cookies if you switch to cookie-based auth.
