# Authentication & Session Management

## Overview

Daarkin implements JWT-based authentication with automatic session persistence using localStorage. Users can register, log in, and maintain their session across browser refreshes without needing to re-authenticate.

## Architecture

### Backend (API)
- **Auth Service** (`api/src/services/auth.service.js`): Handles registration, login, token generation, and validation
- **Auth Routes** (`api/src/routes/auth.routes.js`): Exposes POST `/register` and POST `/login` endpoints
- **Validation**: Input validation via Zod schemas (`api/src/schemas/auth.schema.js`)
- **Security**: bcrypt for password hashing (10 rounds), JWT signing with `HS256` algorithm

### Frontend (Web)
- **Auth API Service** (`web/src/services/auth-api.ts`): TypeScript client for login/register endpoints
- **AuthContext** (`web/src/context/AuthContext.tsx`): Manages auth state and session persistence
- **useAuth Hook** (`web/src/hooks/useAuth.ts`): Provides typed access to auth context
- **App Router** (`web/src/App.tsx`): Conditionally routes to Landing (auth) or Dashboard based on state

## Session Persistence Flow

### On Mount (Initial App Load)
1. `AuthProvider` initializes with `loading = true`
2. Checks localStorage for stored `token` and `user` JSON
3. If found, hydrates state with cached credentials
4. Sets `loading = false` to signal restoration complete
5. `App` component displays loading spinner during hydration

### On Login/Register Success
1. Backend returns `{ user, token }` payload
2. Frontend calls `login(token, user)` from auth context
3. Context stores both values in:
   - React state (immediate UI update)
   - localStorage (persistence for page reload)

### On Page Refresh
1. Browser reloads app and mounts React tree
2. `AuthProvider` detects cached token/user in localStorage
3. Restores session automatically without user interaction
4. User sees brief loading spinner, then dashboard appears

### On Logout
1. `logout()` clears React state
2. Removes `token` and `user` from localStorage
3. User redirected to Landing page automatically

## Data Flow

```
Landing Page (form)
    ↓
auth-api.ts (registerUser / loginUser)
    ↓
POST /api/register or /api/login
    ↓
Auth Service (validate, hash, sign JWT)
    ↓
{ user: {...}, token: "jwt-token" }
    ↓
AuthContext.login(token, user)
    ↓
[React state + localStorage]
    ↓
App Router detects isAuthenticated = true
    ↓
Display Dashboard
```

## Type Definitions

### User
- `id` (string): User ID from database
- `email` (string): User email address

### AuthResponse  
- `user` (User): Authenticated user info
- `token` (string): JWT token for API authentication

### AuthContextValue
- `user` (User | null): Current logged-in user
- `token` (string | null): Current JWT token
- `loading` (boolean): True while restoring from localStorage
- `isAuthenticated` (boolean): Combined flag for `token && user`
- `login(token, user)`: Function to set auth state
- `logout()`: Function to clear auth state

## Security Considerations

1. **Token Storage**: Stored in localStorage (accessible via JavaScript)
   - Vulnerable to XSS attacks if JS is compromised
   - Suitable for this MVP; consider httpOnly cookies in production
   
2. **Password Security**: Hashed with bcrypt (10 rounds) before storage
   - Never stored in plain text
   - Verified on login attempt

3. **JWT Expiration**: Current implementation does not include expiration
   - Should add `exp` claim in production for session timeout
   - Consider refresh token rotation

4. **CORS/HTTPS**: Not yet enforced
   - Configure CORS headers to whitelist frontend origin
   - Use HTTPS in production to prevent token interception

## Error Handling

- **Invalid credentials**: Generic message "Email or password is incorrect" (prevents user enumeration)
- **Email already registered**: Explicit message on register attempt
- **Network errors**: Caught and displayed to user
- **Invalid stored session**: Cleared and user redirected to login

## API Endpoints

### POST /api/register
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Success Response (201):
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "token": "jwt-token-string"
  }
}

Error Response (400):
{
  "success": false,
  "error": {
    "message": "Email is already registered. Please log in instead.",
    "code": "VALIDATION_ERROR"
  }
}
```

### POST /api/login
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Success Response (200):
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "token": "jwt-token-string"
  }
}

Error Response (400/401):
{
  "success": false,
  "error": {
    "message": "Email or password is incorrect.",
    "code": "AUTH_ERROR"
  }
}
```

## Future Improvements

1. Add JWT expiration and refresh token logic
2. Implement httpOnly cookie storage for better XSS protection
3. Add email verification on registration
4. Implement password reset flow
5. Add rate limiting on auth endpoints
6. Track login history and active sessions
7. Add two-factor authentication (2FA)
8. Implement role-based access control (RBAC)
