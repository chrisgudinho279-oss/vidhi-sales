# VIDHI SALES – Billing & Invoicing System

Housekeeping & Professional Cleaning Solutions • Phone 9049007159

**Data flow:** React (Vite) → Express REST API → Sequelize ORM → MySQL (`vidhi_billing`)

## 1. Requirements
- Node.js 18 or newer (https://nodejs.org – LTS)
- MySQL 8 or MariaDB (XAMPP's MySQL also works – start it from the XAMPP panel)

## 2. Setup (exact commands)
```bash
cd vidhi-sales-billing
npm install                 # installs "concurrently" at root
npm install --prefix client # React + Vite
npm install --prefix server # Express + Sequelize + mysql2 ...
```
(or just: `npm run install-all`)

## 3. Configure .env
`.env` already exists (copied from `.env.example`). Open it and set your MySQL password:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vidhi_billing
DB_USER=root
DB_PASSWORD=
JWT_SECRET=change_this_secret
PORT=4000
```
You do NOT need to create the database by hand – the server creates `vidhi_billing`, all tables, and the seed data on first start.
(Manual option: `CREATE DATABASE vidhi_billing;`)

## 4. Run
```bash
npm run dev            # starts backend (4000) + frontend (5173) together
```
Or separately: `npm run dev --prefix server` and `npm run dev --prefix client`.
Open **http://localhost:5173**

Re-seed any time: `npm run seed`

### Email invoices
Open a saved invoice and choose **Print & Email**. The invoice PDF is sent to the customer's saved email address and copied to the business email in Settings, then the print dialog opens. **Print Only** prints without sending.

To enable password-free sending, configure a Google OAuth web application:

1. In Google Cloud Console, create/select a project, enable the Gmail API, and configure the OAuth consent screen. Add the Gmail account that will send invoices as a test user while the app is in testing.
2. Create an OAuth client ID of type **Web application**. Add `http://localhost:4000/api/email/google/callback` as an authorized redirect URI for local use.
3. Add these values to the server `.env`: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REDIRECT_URI`, and `CLIENT_ORIGIN`. Keep the client secret private. Set a private, stable `JWT_SECRET` before connecting Gmail; it encrypts the saved refresh token, so changing it later requires reconnecting Gmail.
4. Restart the server. In the app's **Settings**, enter the business copy address and choose **Connect Gmail**. Sign in to Google and approve Gmail sending access once. The app does not collect or store your Google password.

Google OAuth apps left in testing mode may have refresh tokens expire after seven days; for ongoing automatic sending, follow Google's publishing and verification requirements. Customer addresses must be saved on each invoice.

### Client architecture
The React client follows Feature-Sliced Design (FSD): `src/app` owns app setup and routes, `src/pages` contains route screens, `src/widgets` contains the shared application shell, `src/features` contains user actions and workflows, and `src/shared` holds reusable UI, API, config, and utility code. Cross-slice imports use each slice's `index.js` public API, and `@/` resolves to `src/`.

## 5. Default login
`admin` / `admin123` (change it in Settings)

## 6. Test checklist
1. Login → Dashboard loads.  2. Products: add / edit / delete a product, change stock.  3. Customers: add one.
4. New Invoice: pick customer, add product (price/GST/stock load automatically) + a service.
5. Try Intra-State (CGST+SGST) then Inter-State (IGST).  6. Set discount %, try Paid / Pending / Partially Paid.
7. Save → check `invoices` and `invoice_items` tables in MySQL; product stock reduced.
8. Invoice History: search, filter, view, delete (stock restored).  9. Print & Email: use the invoice history action after Gmail is connected; Print Only keeps a local A4 print without sending.
10. Reports: year/month, profit or loss.  11. Settings: connect Gmail, set business email, backup/restore, change password.
Also test: quantity more than stock → error message.

## 7. API
| Method | Endpoint |
|---|---|
| POST | /api/auth/login, /api/auth/register, /api/auth/change-password |
| GET POST PUT DELETE | /api/products, /api/products/:id |
| GET POST PUT DELETE | /api/services, /api/services/:id |
| GET POST PUT DELETE | /api/customers, /api/customers/:id |
| GET POST PUT DELETE | /api/invoices, /api/invoices/:id |
| POST | /api/invoices/:id/email |
| GET / POST | /api/invoices/backup , /api/invoices/restore |
| GET | /api/reports/summary , /api/reports/monthly |
| GET PUT | /api/settings |
| GET / POST | /api/email/google/status , /api/email/google/connect , /api/email/google/disconnect |
| PUT | /api/email/business-address |
| GET | /api/email/google/callback (Google OAuth callback) |
All routes except login need `Authorization: Bearer <JWT>`.

## 8. Database
users • customers • products • services • invoices • invoice_items • settings • email_config
Relations: Customer 1→N Invoice, Invoice 1→N InvoiceItem, Product 1→N InvoiceItem, Service 1→N InvoiceItem.
