# Tourist AI Hub (Incredible India Digital Guide)

A modern, production-grade tourism platform featuring an AI Travel Planner, Destination Discovery, and a modern split-screen Authentication Module.

---

## 1. Authentication Architecture & Features

The Authentication system is built according to the split-screen design specification:

- **Split-Screen Layout (`/login` & `/register`)**:
  - **Left Panel (60% width)**: Dynamic multi-image showcase with Ken Burns zoom, application logo, title ("Tourist AI Digital Guide" / "ಪ್ರವಾಸಿ ಎಐ ಡಿಜಿಟಲ್ ಮಾರ್ಗದರ್ಶಿ"), subtitle, and digital tourism record badge. Hidden on mobile (`< 960px`).
  - **Right Panel (40% width)**: Card-less panel with toolbar (Palette color picker, Language switcher for English / ಕನ್ನಡ / हिन्दी, and Light/Dark toggle).
- **Interactive Slider Captcha**: Prevents brute-force automated submissions with drag-to-verify mechanics and server-side HMAC token validation.
- **Role-Based Access Control (RBAC)**:
  - `Admin`: Portal management and CRUD privileges, redirects to `/admin`.
  - `Business Partner`: Approved applicants activate an account with their registered email and a password, then redirect to `/partner/dashboard`.
  - `User`: Standard tourist account, redirects to `/dashboard`. Public registration defaults strictly to `User`.
- **Security & Session Management**:
  - Password hashing with `bcryptjs` (salt rounds: 10).
  - Dual JWT tokens: Access Token (15 minutes) + Refresh Token (7 days / 30 days for "Remember password") stored in secure, `httpOnly`, `sameSite` cookies.
  - Authorization Header support (`Bearer <token>`) for cross-client and testing compatibility.
  - Brute-force protection: Account lockout after 5 consecutive failed attempts (15-minute temporary lockout).
  - Real-time inline field validation on blur and submit.
  - 2-Step Forgot Password & Reset Password workflow with 6-digit verification codes.

---

## 2. Seed Data & Test Credentials

The database comes pre-configured with test accounts:

| Role | Username | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@example.com` | `Admin@1234` | `/admin` |
| **User** | `user01` | `user@example.com` | `User@1234` | `/dashboard` |

> [!IMPORTANT]
> **Production Notice**: Always change these default seed passwords before deploying to a public production environment using the profile settings or running a custom migration.

### Running the Seed Script:
From the backend directory:
```bash
cd backend
npm run seed:auth
```

---

## 3. Environment Setup & Configuration

### Backend Setup (`touristhub/backend`):
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env` based on `.env.example`:
   ```env
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # MySQL Database
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tourist_hub

   # JWT Authentication
   JWT_SECRET=super_secret_tourist_ai_hub_jwt_token_key_2026
   JWT_REFRESH_SECRET=super_secret_refresh_token_tourist_hub_2026
   ```
3. Run migrations and seed data:
   ```bash
   npm run seed:auth
   ```
4. Start backend server:
   ```bash
   npm start
   # or with auto-reload:
   npm run dev
   ```

### Frontend Setup (`touristhub/frontend`):
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 4. REST API Documentation (Auth Endpoints)

### `GET /api/auth/slider-token`
- **Description**: Generates a cryptographically signed HMAC token for slider verification.
- **Response**: `{ success: true, sliderToken: "..." }`

### `POST /api/auth/register`
- **Description**: Creates a new User account with real-time validation.
- **Body**:
  ```json
  {
    "fullName": "Aarav Sharma",
    "username": "aarav_s",
    "email": "aarav@example.com",
    "phone": "+91 9876543210",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "termsAccepted": true,
    "sliderToken": "...",
    "sliderVerified": true
  }
  ```
- **Responses**:
  - `201 Created`: `{ success: true, token, user }` + Sets `touristhub_access_token` & `touristhub_refresh_token` cookies.
  - `400 Bad Request`: Validation errors or duplicate email/username.

### `POST /api/auth/login`
- **Description**: Authenticates users with username or email, role verification, and lockout check.
- **Body**:
  ```json
  {
    "account": "admin",
    "password": "Admin@1234",
    "role": "Super Admin",
    "rememberPassword": true,
    "sliderVerified": true
  }
  ```
- **Responses**:
  - `200 OK`: `{ success: true, token, user }` + Sets auth cookies.
  - `401 Unauthorized`: Invalid credentials (with remaining attempts counter).
  - `403 Forbidden`: Role mismatch or account deactivated.
  - `423 Locked`: Account locked for 15 minutes due to 5 consecutive failed attempts.

### `POST /api/auth/logout`
- **Description**: Clears `touristhub_access_token` and `touristhub_refresh_token` cookies.
- **Response**: `200 OK`: `{ success: true, message: "Logged out successfully." }`

### `GET /api/auth/me`
- **Description**: Retrieves current authenticated user profile using cookie or Bearer token.
- **Headers**: `Authorization: Bearer <access_token>` or cookie.
- **Response**: `200 OK`: `{ success: true, user }`

### `POST /api/auth/forgot-password`
- **Description**: Initiates password reset by issuing a 6-digit verification code.
- **Body**: `{ "account": "user@example.com" }`
- **Response**: `200 OK`: `{ success: true, message: "Code sent", resetCode: "..." }`

### `POST /api/auth/reset-password`
- **Description**: Verifies 6-digit code and updates password.
- **Body**:
  ```json
  {
    "account": "user@example.com",
    "resetCode": "543440",
    "newPassword": "NewSecure@Password1",
    "confirmPassword": "NewSecure@Password1"
  }
  ```
- **Response**: `200 OK`: `{ success: true, message: "Password reset successful." }`

---

## 5. Verification & Automated Tests

To run the complete automated test suite verifying all 14 authentication requirements:
```bash
cd backend
npm run test:auth
```
Tests verified:
1. Slider token cryptographic signing & verification
2. Super Admin login with `admin` / `Admin@1234`
3. Admin login with `manager01` / `Manager@1234`
4. User login with `user01` / `User@1234`
5. Role mismatch rejection (403)
6. Wrong password rejection and attempt tracking (401)
7. Missing slider verification rejection (400)
8. Duplicate email rejection (400)
9. Weak password rejection (400)
10. Valid user registration (201)
11. Protected `/api/auth/me` token resolution
12. 6-digit forgot password code issuance
13. Password reset execution with new credentials
14. Secure cookie and token logout

---

## 6. Business Partner Review and Public Listings

### Existing behavior

- A business submits an application and PDF verification documents; an administrator can inspect the application and approve or reject it.
- Approved businesses can activate a `Business Partner` account.
- Administrators can create and edit service listings, upload listing images, and publish or unpublish listings.

### Added workflow

- Partner registration begins with email, then collects the existing business details and required verification documents. Registration includes a **Check Application Status** option using the application ID and email.
- Applicants do not receive an email-verification link. Administrators can review and approve a pending application directly. When an approved applicant checks status, the page automatically emails a random temporary password to the application’s registered email; the tracker never displays it. The password expires in 24 hours, is stored only as a bcrypt hash, and must be changed at first sign-in. Pending and rejected applications cannot create a partner account.
- Temporary-password requests and email outcomes are retained in the account setup event history and are rate-limited. A temporary sign-in token can only access the required password-change endpoint; it cannot access partner APIs. Previously issued one-time setup links remain supported for compatibility.
- SMTP delivery is required to send the temporary password. If delivery fails, the account is not left usable with an undisclosed password; the approved partner can retry from the status page after the administrator fixes email configuration.
- An approved Business Partner submits a service listing from the Partner Dashboard. New submissions are stored as `Submitted`; the partner cannot publish.
- Administrators use **Partner applications** and **Partner listings** in the Admin Dashboard to review applications and service submissions. The listing queue supports status, category, partner name, and submission-date filters.
- Administrators can request corrections or reject a listing with a reason. A partner can edit and resubmit only a listing in `Changes Requested`; every resubmission is retained for comparison.
- Partners can propose changes to a published or unpublished listing in a separate request. The live listing and price do not change until an administrator approves; rejected requests retain feedback without changing the service.
- An administrator edits the public listing, manages images and accessibility text, previews the result, approves it to a draft, and publishes it. Only published listings with an approved application and an active partner account appear in the tourist catalogue.
- Verification documents are stored separately from listing images. PDF endpoints require the owner partner or an administrator; image bytes for unpublished listings require administrator access.
- The Business Partner dashboard reuses the existing application/status and login flows, and includes service submissions, pending update status, administrator feedback, and partner questions/replies.
- Partners set a required capacity for each Quick Add service. Administrators can review and edit capacity and booked units; tourists do not see capacity, and fully booked listings are excluded from public results. Checkout verifies and reserves capacity atomically; hotel/guide listings and vehicle listings use one unit per booking, while bus and person-priced services use the guest count.
- Listing decisions, edits, image changes, submissions, service-update approvals/rejections, and publication events are recorded in audit/history tables. Unpublishing preserves the listing record.

### Database and storage setup

The idempotent partner application/listing migrations are invoked by backend startup and `npm run init:db`. For a deployment or existing database, review and back up the database before running:

```bash
cd backend
npm run init:db
```

The application creates `partner_applications`, `partner_documents`, `partner_audit_logs`, `partner_account_setup_events`, `partner_queries`, `partner_service_listings`, `partner_service_change_requests`, `listing_images`, `listing_audit_logs`, and `partner_listing_submissions` when absent, and extends listing statuses for review. The listings migration adds capacity to existing services and adds listing/capacity-unit references to bookings without deleting existing records. The partner migration adds setup-token hash, expiry, and use-time columns additively to existing applications. Database initialization also adds `users.must_change_password` and `users.temporary_password_expires_at` for expiring partner temporary passwords. Legacy email-verification columns on existing databases are left in place for compatibility but are no longer used. `npm run init:db` invokes the partner-question, service-change, and listings migrations; it is safe to rerun and does not delete application, service, booking, or payment records. Uploaded files use `PARTNER_DOCUMENT_DIR` and `LISTING_IMAGE_DIR` from `backend/.env`; defaults are `backend/uploads/partner-docs` and `backend/uploads/listing-images`. Keep the document directory private and configure durable storage for production deployments. Do not expose the uploads directory as a static web root.

Configure the following backend environment variables to send email:

```env
CLIENT_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Set them to your SMTP provider’s values (use TLS settings required by that provider). The approved application status page emails a random temporary password only to the registered address. It expires after 24 hours, is stored only as a password hash, and must be changed at the first sign-in. Without SMTP configuration, password delivery fails explicitly and the account is not left usable with an undisclosed password.

### Relevant API routes

- `POST /api/partner/apply`, `GET /api/partner/status`, `POST /api/partner/check-status`, and `POST /api/partner/status/request-temporary-password` — application submission, status lookup, and temporary-password email retry for the matching approved application. The status page requests the initial email automatically after approval.
- `GET /api/partner/account-setup` and `POST /api/partner/complete-account-setup` — validate a one-time setup link and create the approved partner account with a hashed password.
- `POST /api/partner/status/request-account-setup` — compatibility endpoint for one-time setup links already used by the prior workflow.
- `POST /api/auth/complete-required-password-change` — set a new password after temporary-password sign-in; the limited change token cannot access protected APIs.
- `POST /api/listings/my`, `GET /api/listings/my`, `PUT /api/listings/my/:id` — Business Partner submission, own status, and correction resubmission.
- `GET /api/listings/admin` and `GET /api/listings/admin/:id` — administrator queue and review details/history.
- `PATCH /api/listings/admin/:id/review` — approve to draft, reject, or request corrections.
- `POST /api/listings/my/:id/change-requests`, `GET /api/listings/my/change-requests` — submit and view partner proposals for existing services.
- `GET /api/listings/admin/change-requests`, `PATCH /api/listings/admin/change-requests/:id/review` — compare and approve/reject service changes; approval is the only operation that applies proposed fields.
- `PUT /api/listings/admin/:id`, `POST /api/listings/admin/:id/images`, and image metadata/delete routes — administrator listing editor.
- `PATCH /api/listings/admin/:id/publish` and `/unpublish` — administrator publication controls.
- `GET /api/listings` and `GET /api/listings/:id` — published tourist catalogue and detail.
- `GET /api/partner/admin/documents/:docId` and `GET /api/partner/my-documents/:docId` — protected verification document access.
- `GET/POST /api/partner/my/queries`, `GET /api/partner/admin/queries`, `POST /api/partner/admin/queries/:id/reply` — partner questions and administrator replies.

### Partner workflow tests

Run the focused API tests with:

```bash
cd backend
npm run test:partner
```

The current tests use a mocked database and cover partner ownership, role checks, protected documents and image previews, invalid image signatures, correction/edit history, publication, and tourist visibility. They do not verify a live MySQL migration or production object-storage configuration.
