# Production deployment

This project uses MySQL, so deploy the API and database on Railway and the
React/Vite frontend on Vercel.

## 1. Deploy the API and database on Railway

1. Create a Railway project from the existing GitHub repository and add a
   MySQL service to the project.
2. Create a service from the same repository for the API. Set its root
   directory to `/server`; Railway will use `npm start`.
3. Add these variables to the API service, using Railway's variable references
   to the MySQL service's corresponding values:

   | API variable | MySQL service variable |
   | --- | --- |
   | `DB_HOST` | `MYSQLHOST` |
   | `DB_PORT` | `MYSQLPORT` |
   | `DB_NAME` | `MYSQLDATABASE` |
   | `DB_USER` | `MYSQLUSER` |
   | `DB_PASSWORD` | `MYSQLPASSWORD` |

4. Set `JWT_SECRET` to a new, long, random secret. Do not reuse the local
   development secret or commit it to the repository.
5. Deploy the API service and generate a public domain for it. The service
   starts the API, creates its tables, and seeds the initial data on first
   startup.

## 2. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the project root directory to `client`. Use `npm run build` as the
   build command and `dist` as the output directory.
3. Add the environment variable `VITE_API_URL` with the API's public origin,
   for example `https://your-api.up.railway.app` (do not append `/api`).
4. Deploy. The included Vercel rewrite sends frontend routes to the React app,
   and API requests go directly to Railway.

Add your Vercel production URL as `CLIENT_ORIGIN` on Railway if configuring
Gmail invoice sending. For Google OAuth, also add the production callback URL
`https://your-api.up.railway.app/api/email/google/callback` to the OAuth
client's authorized redirect URIs, and set the matching
`GMAIL_OAUTH_REDIRECT_URI` on Railway.

The initial login is `admin` / `admin123`; change it immediately after the
first login. Never put database credentials, OAuth secrets, or `JWT_SECRET`
in Vercel's `VITE_*` variables, since frontend variables are public.
