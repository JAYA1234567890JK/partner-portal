# Roomly API

This backend uses Prisma 6 with PostgreSQL hosted by Supabase. Copy `.env.example` to `.env` and enter the Supabase connection URLs locally; do not commit `.env`.

Use the Supabase pooled connection URL for `DATABASE_URL` and the direct database URL for `DIRECT_URL` when running migrations. Prisma Client and migrations use `prisma/schema.prisma`.

## Install and run

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The health endpoint is `http://localhost:5000/api/health`.

## Prisma commands

```powershell
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:studio
```

`prisma:migrate:dev` creates/applies development migrations. `prisma:migrate:deploy` applies committed migrations in deployment environments. Neither script resets the database. The development database smoke test uses a temporary PostgreSQL table in a transaction and drops it automatically:

```powershell
npm run db:verify
```

## Verify tables in Supabase

After a migration succeeds, run this in the Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

The initial migration creates `User`, `Partner`, `Property`, `PropertyImage`, `Room`, `RoomImage`, and `HourlyPricing`, plus four enum types and their indexes/foreign keys.

## Partner authentication (Phase 3)

Set `JWT_SECRET` in `backend/.env` to a private random value of at least 32 characters. Keep `FRONTEND_URL` set to the exact frontend origin (comma-separated origins are supported). The API stores short-lived JWTs in an HttpOnly cookie; it never returns a token in JSON. Browser requests must include credentials. Production cookies use `Secure` and `SameSite=None`; state-changing browser requests are checked against the configured origin. Login and registration have per-process IP rate limits.

Before a multi-instance production launch, move the rate-limit counters to a shared store and add refresh-token rotation/revocation. The current access JWT is intentionally short-lived and has no refresh token.

## Partner onboarding and dashboard APIs (Phase 4)

The Partner Portal uses the authenticated endpoints below. They all derive the partner from the validated session cookie; clients do not submit a user or partner ID.

- `GET /api/partner/onboarding/draft`
- `PUT /api/partner/onboarding/draft` with `{ "draft": { ... } }`
- `POST /api/partner/properties` with `{ "draft": { ... } }` to submit for review
- `GET /api/partner/properties`
- `GET /api/partner/dashboard`

The onboarding migration adds JSONB snapshots for fields not represented by normalized columns, plus room and image metadata. Room, image, pricing, and property rows are written together transactionally. The dashboard returns empty bookings/payments and zero revenue until those domain APIs are implemented. Bank account, PAN, GST, and confirmation values are deliberately omitted from server payloads; they remain only in the existing browser draft until secure encrypted storage is designed.

After setting Supabase `DATABASE_URL` and `DIRECT_URL`, apply the new migration with `npm run prisma:migrate:dev` locally or `npm run prisma:migrate:deploy` in deployment. The frontend reads `REACT_APP_API_URL` from its CRA environment; copy `.env.example` to `.env.local` in the frontend project and set it to `http://localhost:5000/api` for local use.

## Supabase Storage image uploads (Phase 5)

Create two **public-read** buckets in Supabase Storage named `property-images` and `room-images`. Public read allows the stored image URLs to load in partner and customer views; uploads and deletes still go through the authenticated API. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the backend `.env`. Never add the service-role key to the React environment.

Apply the new storage metadata migration with `npm run prisma:migrate:dev` (or `npm run prisma:migrate:deploy` in deployment), then restart the API. The API uses in-memory Multer uploads, allows up to 10 images per request at 5 MB per image, checks MIME type and file signature, uploads the bytes to Supabase, then writes only the public URL and metadata to PostgreSQL. If a database write fails, it removes the objects uploaded by that request.

Authenticated PARTNER requests:

- `POST /api/properties/:propertyId/images` — multipart `images` fields; optionally `category` or a JSON `categories` array matching the file count.
- `GET /api/properties/:propertyId/images`
- `DELETE /api/properties/:propertyId/images/:imageId`
- `PATCH /api/properties/:propertyId/images/:imageId` — set `category` or `isCover`.
- `PATCH /api/properties/:propertyId/images/order` — JSON `{ "imageIds": ["id-in-order", "..."] }`.
- The matching upload/list/delete/update/order routes are available under `/api/rooms/:roomId/images`.

Every operation verifies the logged-in partner owns the target property or its room. For a Postman multipart request, add one `images` file row per image and a text `category` field (for example `Bedroom`). A successful upload response contains the image rows only after Supabase upload and PostgreSQL persistence both succeed.

Restart the backend after configuring `.env`. For local work, `http://localhost:3000` is the default frontend origin and the default access-token lifetime is 15 minutes.

### Postman examples

Use `http://localhost:5000` as the base URL. In Postman, enable its cookie jar for `localhost` so the login cookie is stored and sent on later requests.

Register (`POST /api/auth/register`, JSON):

```json
{
  "fullName": "Alex Partner",
  "businessName": "Roomly Test Hotel",
  "email": "alex.partner@example.com",
  "phone": "+919876543210",
  "password": "RoomlyPass123",
  "confirmPassword": "RoomlyPass123"
}
```

Login (`POST /api/auth/login`, JSON):

```json
{
  "email": "alex.partner@example.com",
  "password": "RoomlyPass123"
}
```

Then send `GET /api/auth/me` and `POST /api/auth/logout` with the same cookie jar. A successful login response omits the JWT body; inspect Postman's cookie jar to confirm `roomly_access` is an HttpOnly cookie. Duplicate registration returns HTTP 409, invalid credentials return the same generic HTTP 401 response, and protected requests without a valid cookie return HTTP 401. `/api/auth/me` is partner-only, so a valid CUSTOMER or ADMIN cookie receives HTTP 403.

### Authentication checks

With the Supabase database migrated and `.env` configured, run the Postman sequence above. Register a unique email for each run. To check wrong-password handling, repeat login with that email and an incorrect password. To check role restrictions, use a test fixture whose database role and signed test JWT role both match `CUSTOMER` or `ADMIN`, then request `/api/auth/me`; the partner-only route should return HTTP 403. The normal partner login deliberately issues cookies only for PARTNER accounts. Logout clears the cookie using the same path/domain/security attributes used when setting it.
