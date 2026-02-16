# Quick Start Testing Guide

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB Atlas accessible

## Step 1: Restart Backend

The MongoDB connection fixes require a backend restart:

```powershell
cd backend
python app.py
```

**Expected output:**
```
✅ MongoDB connected successfully
MongoDB database: metis_db
* Running on http://localhost:5000
```

**If you see SSL errors:**
1. Check MongoDB Atlas → Network Access
2. Add your current IP address to allowlist
3. Or temporarily allow all IPs: `0.0.0.0/0`

## Step 2: Test Email/Password Flow

### Registration
1. Go to `http://localhost:3000/register`
2. Fill form (3 steps):
   - Step 1: Name, email, password
   - Step 2: Role, phone, optional URLs
   - Step 3: Review and submit
3. Click "Complete Registration"
4. Should redirect to `/dashboard`

**Expected:**
- No console errors
- Dashboard loads with correct role (HR or Candidate)
- User data visible in navbar

### Login
1. Go to `http://localhost:3000/login`
2. Enter email and password
3. Click "Sign In"
4. Should redirect to `/dashboard`

**Quick test accounts:**
- HR: `hr@example.com` / `hr@123456`
- Candidate: `candidate@example.com` / `can@123456`

## Step 3: Test OAuth New User Flow

### From Register Page
1. Go to `http://localhost:3000/register`
2. Click "Google" or "LinkedIn" button
3. Complete OAuth consent
4. Should redirect to `/auth/select-role`
5. Select "HR" or "Job Seeker"
6. Should redirect to `/dashboard`

**Expected:**
- No infinite redirects
- Role selection page shows correctly
- Dashboard reflects selected role
- Can logout and login again (should skip role selection)

### From Login Page
1. Use a NEW Google/LinkedIn account (not registered before)
2. Go to `http://localhost:3000/login`
3. Click "Google" or "LinkedIn"
4. Complete OAuth consent
5. Should redirect to `/auth/select-role`
6. Select role
7. Should redirect to `/dashboard`

## Step 4: Test OAuth Existing User Flow

1. Use the SAME Google/LinkedIn account from Step 3
2. Logout from dashboard
3. Go to `http://localhost:3000/login`
4. Click same OAuth provider
5. Should redirect DIRECTLY to `/dashboard` (skip role selection)

**Expected:**
- No role selection page
- Loads previous role and data
- No errors

## Step 5: Test Error Scenarios

### Wrong Password
1. Go to `/login`
2. Enter correct email but wrong password
3. Should show: "Invalid email or password"

### Network Error (Backend Down)
1. Stop backend server
2. Try to login
3. Should show error message
4. Start backend again

### OAuth Error
1. In backend, temporarily break check-email endpoint
2. Try OAuth login
3. Should redirect to `/auth/error` page
4. Should show user-friendly error message

## Step 6: Verify No Regressions

### Dashboard Access Control
1. Without logging in, go to `http://localhost:3000/dashboard`
2. Should redirect to `/login`

### Select-Role Access Control
1. Without OAuth session, go to `http://localhost:3000/auth/select-role`
2. Should redirect to `/login`

### Logout
1. Login with any method
2. Click logout button
3. Should clear session
4. Should redirect to `/login`
5. Trying to access `/dashboard` should redirect to `/login`

## Step 7: Browser DevTools Checks

### Console
- ✅ No errors during OAuth flow
- ✅ No "undefined" warnings
- ✅ No infinite loop errors

### Network Tab
- ✅ `/api/users/check-email` returns 200
- ✅ `/api/users/oauth-login` returns 200
- ✅ `/api/users/oauth-register` returns 200
- ✅ No 500 errors from backend

### Application Tab → Local Storage
**Email/Password user:**
- `authToken` - JWT token
- `userId` - User ID  
- `userRole` - "hr" or "candidate"

**OAuth user:**
- May or may not have localStorage (NextAuth uses cookies)
- Check cookies for `next-auth.session-token`

### Application Tab → Cookies
**OAuth user:**
- `next-auth.session-token` - encrypted session
- `next-auth.callback-url` - temporary during flow

## Common Issues & Solutions

### Issue: "SSL handshake failed"
**Solution:** 
1. Check backend `.env` has correct MongoDB URI with TLS params
2. Restart backend server
3. Check MongoDB Atlas IP allowlist

### Issue: Infinite redirect loop
**Solution:**
1. Clear browser cookies and localStorage
2. Check `needsRoleSelection` flag logic in NextAuth callbacks
3. Verify `/auth/select-role` page checks for session

### Issue: OAuth user not redirecting to select-role
**Solution:**
1. Check NextAuth signIn callback sets `needsRoleSelection = true`
2. Check login page useEffect detects flag properly
3. Verify session is loading correctly

### Issue: "Failed to sign in"
**Solution:**
1. Verify OAuth credentials in `.env.local`
2. Check OAuth app settings (redirect URIs)
3. Test with different browser (clear cache)

### Issue: Dashboard shows wrong role
**Solution:**
1. Check backend returns correct role from API
2. Verify auth context maps session correctly
3. Check localStorage for email users

## Success Criteria Checklist

- [ ] Email registration works → dashboard
- [ ] Email login works → dashboard
- [ ] Google OAuth new user → select-role → dashboard
- [ ] LinkedIn OAuth new user → select-role → dashboard
- [ ] Google OAuth existing user → dashboard (direct)
- [ ] LinkedIn OAuth existing user → dashboard (direct)
- [ ] Wrong password shows error
- [ ] Logout clears session
- [ ] No redirect loops
- [ ] No console errors
- [ ] MongoDB SSL connection working
- [ ] Error page shows for OAuth failures
- [ ] Dashboard access protected
- [ ] Select-role access protected

## Performance Checks

Open browser Performance tab and record:

### Initial Page Load
- Time to Interactive: < 2s
- No unnecessary re-renders
- No blocked resources

### OAuth Flow
- Check-email API: < 500ms
- OAuth-login API: < 1s
- Session update: < 200ms

### Dashboard Load
- Profile fetch: < 1s
- Role-specific dashboard: < 500ms

## Next Steps After Testing

If all tests pass:
1. ✅ Commit changes
2. ✅ Update documentation
3. ✅ Deploy to staging
4. ✅ Run integration tests
5. ✅ Deploy to production

If tests fail:
1. Check error messages
2. Review AUTH_FLOW_DOCUMENTATION.md
3. Review REFACTORING_SUMMARY.md
4. Check backend logs
5. Test in incognito mode
