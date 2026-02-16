# Authentication Flow Documentation

## Overview
This document describes the clean, consistent authentication flow for Metis. The system supports two authentication methods:
1. **Email/Password** - Traditional login with JWT tokens
2. **OAuth** - Google and LinkedIn social login

## Architecture

### Core Components

1. **NextAuth.js** (`app/api/auth/[...nextauth]/route.ts`)
   - Handles OAuth providers (Google, LinkedIn)
   - Manages credentials-based auth for email/password
   - Stores user data in JWT tokens
   - Manages session state

2. **Auth Context** (`contexts/auth-context.tsx`)
   - Global authentication state management
   - Syncs NextAuth session with local storage
   - Provides `useAuth()` hook for components

3. **Auth Service** (`lib/api/services.ts`)
   - API calls to Flask backend
   - Token management (localStorage)
   - Profile fetching

## Authentication Flows

### 1. Email/Password Registration

**User Journey:**
```
/register → Fill form (3 steps) → /dashboard
```

**Implementation:**
1. User fills registration form (name, email, password, role, etc.)
2. Frontend calls `authService.register()`
3. Backend creates user and returns JWT token
4. Frontend stores token in localStorage
5. User redirected to `/dashboard`

**Files involved:**
- `app/register/page.tsx` - Registration form
- `lib/api/services.ts` - `register()` method
- Backend: `/api/users/register`

### 2. Email/Password Login

**User Journey:**
```
/login → Enter credentials → /dashboard
```

**Implementation:**
1. User enters email and password
2. Frontend calls backend `/api/users/login`
3. Backend validates and returns JWT token
4. Frontend stores token in localStorage
5. Also signs in with NextAuth for session consistency
6. User redirected to `/dashboard`

**Files involved:**
- `app/login/page.tsx` - Login form
- `lib/api/services.ts` - `login()` method
- Backend: `/api/users/login`

### 3. OAuth Registration (New User)

**User Journey:**
```
/register → Click Google/LinkedIn → Auth consent → /auth/select-role → /dashboard
```

**Implementation:**
1. User clicks OAuth provider button
2. NextAuth initiates OAuth flow
3. After consent, NextAuth callback checks if user exists (backend `/api/users/check-email`)
4. **New user**: Sets `needsRoleSelection = true`
5. `login/page.tsx` useEffect detects `needsRoleSelection` and redirects to `/auth/select-role`
6. User selects role (HR or Candidate)
7. Frontend calls backend `/api/users/oauth-register`
8. Backend creates user with OAuth data + selected role
9. NextAuth session updated with user data
10. User redirected to `/dashboard`

**Files involved:**
- `app/register/page.tsx` - OAuth buttons
- `app/api/auth/[...nextauth]/route.ts` - OAuth callbacks
- `app/auth/select-role/page.tsx` - Role selection
- Backend: `/api/users/check-email`, `/api/users/oauth-register`

### 4. OAuth Login (Existing User)

**User Journey:**
```
/login → Click Google/LinkedIn → Auth consent → /dashboard
```

**Implementation:**
1. User clicks OAuth provider button
2. NextAuth initiates OAuth flow
3. After consent, NextAuth callback checks if user exists
4. **Existing user**: Calls backend `/api/users/oauth-login`
5. Backend returns full user data
6. NextAuth session populated with user data
7. User redirected to `/dashboard`

**Files involved:**
- `app/login/page.tsx` - OAuth buttons
- `app/api/auth/[...nextauth]/route.ts` - OAuth callbacks
- Backend: `/api/users/check-email`, `/api/users/oauth-login`

## Data Flow

### Session Data Structure

**NextAuth Session:**
```typescript
{
  user: {
    id: string;              // User ID from backend
    email: string;
    name: string;
    image?: string;
    role: "hr" | "candidate";
    provider?: string;       // "google" | "linkedin" | undefined
    providerId?: string;
    needsRoleSelection: boolean;
  }
}
```

**Auth Context User:**
```typescript
{
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "hr" | "candidate";
  image?: string;
  createdAt: string;
}
```

### Storage

**localStorage (Email/Password users):**
- `authToken` - JWT token from backend
- `userId` - User ID
- `userRole` - User role

**NextAuth Session (OAuth users):**
- Stored in HTTP-only cookies
- Accessible via `useSession()` hook

## Key Design Decisions

### 1. Unified Flow
- Both OAuth and email/password users end up in the same dashboard
- Auth context syncs both authentication methods
- No separate "OAuth route" vs "email route"

### 2. Role Selection for OAuth
- OAuth providers don't give us role information
- New OAuth users must select role before accessing the app
- `needsRoleSelection` flag controls this flow
- Dedicated `/auth/select-role` page for clean UX

### 3. No Session Storage Hacks
- ❌ Removed `sessionStorage.setItem('oauth_source', 'login')`
- ✅ Let NextAuth session state drive redirects
- ✅ useEffect hooks respond to session changes

### 4. Simplified Redirects
- NextAuth `redirect` callback kept minimal
- Page-level useEffect handles intelligent redirects
- Checks `needsRoleSelection` flag
- Checks authentication status

### 5. Error Handling
- Dedicated `/auth/error` page for OAuth failures
- User-friendly error messages
- Retry buttons
- Consistent error display across flows

## Backend Integration

### Required Backend Endpoints

1. **POST /api/users/register**
   - Email/password registration
   - Returns: `{ token, userId, role, firstName, lastName, email }`

2. **POST /api/users/login**
   - Email/password login
   - Returns: `{ token, userId, role, firstName, lastName, email }`

3. **POST /api/users/check-email**
   - Check if email exists
   - Returns: `{ exists: boolean }`

4. **POST /api/users/oauth-login**
   - OAuth login for existing users
   - Body: `{ email, name, provider, providerId, image }`
   - Returns: `{ user: { id, email, role, ... } }`

5. **POST /api/users/oauth-register**
   - OAuth registration for new users
   - Body: `{ email, name, provider, providerId, image, role }`
   - Returns: `{ user: { id, email, role, ... } }`

6. **GET /api/users/profile**
   - Get current user profile
   - Requires: `Authorization: Bearer <token>`
   - Returns: Full user object

## Testing Checklist

### Email/Password Flow
- [ ] Register new user → redirects to dashboard
- [ ] Login existing user → redirects to dashboard
- [ ] Wrong password → shows error
- [ ] Invalid email → shows validation error
- [ ] Network error → shows friendly error

### OAuth New User Flow
- [ ] Click Google on /register → consent → role selection
- [ ] Click LinkedIn on /register → consent → role selection
- [ ] Select HR role → creates user → redirects to dashboard
- [ ] Select Candidate role → creates user → redirects to dashboard
- [ ] Backend error → shows error page

### OAuth Existing User Flow
- [ ] Click Google on /login → redirects to dashboard immediately
- [ ] Click LinkedIn on /login → redirects to dashboard immediately
- [ ] User data loaded correctly in auth context
- [ ] Role preserved from previous registration

### Logout
- [ ] Email user logout → clears localStorage → redirects to /login
- [ ] OAuth user logout → clears NextAuth session → redirects to /login
- [ ] No redirect loops after logout

### Edge Cases
- [ ] Direct access to /auth/select-role without session → redirect to /login
- [ ] Direct access to /dashboard without auth → redirect to /login
- [ ] Refresh page during registration → state preserved
- [ ] Network timeout during OAuth → error page
- [ ] MongoDB connection failure → error page

## Troubleshooting

### Issue: OAuth infinite redirect loop
**Cause:** `needsRoleSelection` not set properly
**Fix:** Check NextAuth signIn callback sets flag correctly

### Issue: User logged in but shows as unauthenticated
**Cause:** Auth context not syncing with NextAuth session
**Fix:** Verify useEffect in auth-context.tsx runs properly

### Issue: OAuth login creates duplicate users
**Cause:** check-email endpoint not working
**Fix:** Verify backend endpoint returns correct `exists` value

### Issue: MongoDB SSL handshake errors
**Cause:** Missing TLS configuration
**Fix:** Ensure backend has `tls=true` and timeouts set to 30s

## Environment Variables

### Frontend (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
LINKEDIN_CLIENT_ID=<linkedin-oauth-client-id>
LINKEDIN_CLIENT_SECRET=<linkedin-oauth-client-secret>
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/metis_db?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false&appName=Cluster0
JWT_SECRET=<jwt-secret>
```

## Performance Considerations

1. **Session Loading**: Always check `status === 'loading'` before redirecting
2. **Profile Fetching**: Only fetch profile once per session
3. **Token Refresh**: Backend should handle token expiry gracefully
4. **Connection Pooling**: MongoDB connection reused across requests

## Security Notes

1. **JWT Tokens**: Stored in localStorage (vulnerable to XSS)
2. **NextAuth Cookies**: HTTP-only (protected from XSS)
3. **OAuth Tokens**: Never exposed to frontend
4. **Password Hashing**: Backend uses bcrypt
5. **TLS**: All MongoDB connections use TLS
6. **CORS**: Backend restricts to frontend origin only

## Future Improvements

1. [ ] Implement refresh token rotation
2. [ ] Add rate limiting on auth endpoints
3. [ ] Support email verification
4. [ ] Add 2FA option
5. [ ] Implement password reset flow
6. [ ] Add session management (view/revoke sessions)
7. [ ] Migrate JWT to HTTP-only cookies for better security
8. [ ] Add OAuth provider linking (link Google + LinkedIn to same account)
