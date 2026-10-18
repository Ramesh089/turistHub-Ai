# Tourist AI Hub (灵山胜境 / Incredible India Digital Guide)

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
