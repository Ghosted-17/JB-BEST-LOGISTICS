# JB & Best Logistics backend

The repository now includes a standalone Express API in `server/` backed by MongoDB. The existing Vite storefront can migrate endpoint-by-endpoint without losing the current demo experience.

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Start MongoDB.
3. Run `pnpm server:dev`.
4. The API listens on `http://localhost:4000`.

## Core endpoints

- `POST /api/auth/register` customer registration
- `POST /api/auth/login` customer, rider, warehouse, and admin login
- `GET /api/auth/me` current session
- `POST /api/quotes` shipping quote, packaging suggestion, and cutoff result
- `POST /api/shipments` create a shipment and 20-digit tracking ID
- `GET /api/shipments` role-scoped shipment list
- `GET /api/shipments/track/:trackingId` public tracking lookup
- `GET /api/shipments/:id/qr` authenticated QR code generation
- `PATCH /api/shipments/:id/status` rider, warehouse, or admin status update
- `POST /api/shipments/:id/assign-rider` warehouse/admin assignment
- `GET /api/jobs` rider and operations job queue
- `GET /api/notifications` in-app notification feed
- `GET /api/reports/summary` operations summary report

All protected endpoints use `Authorization: Bearer <jwt>`. Customer registration is the only public role creation path. Rider, warehouse, and admin accounts must be provisioned by an administrative workflow, preventing privilege escalation through the public API.

## Security baseline

Helmet, CORS allowlisting, request rate limiting, bcrypt password hashing, JWT expiry, suspended-account checks, role middleware, audit activity logs, and Mongoose validation are enabled. Payment webhooks should continue to verify Paystack signatures before marking payments as paid.

## Next integration steps

- Connect the existing booking and pickup forms to `/api/quotes`, `/api/shipments`, and `/api/jobs`.
- Replace Firebase tracking reads with `/api/shipments/track/:trackingId` or retain Firebase during the migration window.
- Add a managed queue for email/SMS providers and persist delivery attempts in the notification collection.
- Add a payment collection and Paystack initialization endpoint alongside the existing verified webhook.
