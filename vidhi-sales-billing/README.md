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

## 5. Default login
`admin` / `admin123` (change it in Settings)

## 6. Test checklist
1. Login → Dashboard loads.  2. Products: add / edit / delete a product, change stock.  3. Customers: add one.
4. New Invoice: pick customer, add product (price/GST/stock load automatically) + a service.
5. Try Intra-State (CGST+SGST) then Inter-State (IGST).  6. Set discount %, try Paid / Pending / Partially Paid.
7. Save → check `invoices` and `invoice_items` tables in MySQL; product stock reduced.
8. Invoice History: search, filter, view, delete (stock restored).  9. Print: Print button → A4 layout.
10. Reports: year/month, profit or loss.  11. Settings: logo, signature, backup/restore, change password.
Also test: quantity more than stock → error message.

## 7. API
| Method | Endpoint |
|---|---|
| POST | /api/auth/login, /api/auth/register, /api/auth/change-password |
| GET POST PUT DELETE | /api/products, /api/products/:id |
| GET POST PUT DELETE | /api/services, /api/services/:id |
| GET POST PUT DELETE | /api/customers, /api/customers/:id |
| GET POST PUT DELETE | /api/invoices, /api/invoices/:id |
| GET / POST | /api/invoices/backup , /api/invoices/restore |
| GET | /api/reports/summary , /api/reports/monthly |
| GET PUT | /api/settings |
All routes except login need `Authorization: Bearer <JWT>`.

## 8. Database
users • customers • products • services • invoices • invoice_items • settings
Relations: Customer 1→N Invoice, Invoice 1→N InvoiceItem, Product 1→N InvoiceItem, Service 1→N InvoiceItem.
