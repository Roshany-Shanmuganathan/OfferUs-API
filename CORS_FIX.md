# CORS Error Fix - Vercel Deployment

## Problem
When deploying to Vercel, you were experiencing CORS errors even though the origin URL was configured. The error showed:
- `Access to XMLHttpRequest ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`
- `GET ... net::ERR_FAILED 500 (Internal Server Error)`

## Root Cause
The issue was that when a 500 Internal Server Error occurred, the error handler was not preserving CORS headers. This caused the browser to show a CORS error instead of the actual server error.

## Fixes Applied

### 1. Error Handler CORS Headers (`api/src/middleware/errorMiddleware.js`)
- Added `setCorsHeaders()` helper function to ensure CORS headers are always set on error responses
- Updated `errorHandler` to set CORS headers before sending error responses
- Updated `notFound` handler to set CORS headers for 404 responses
- Added better error logging for debugging

### 2. Response Format Utility (`api/src/utils/responseFormat.js`)
- Updated `sendError()` to accept an optional `req` parameter
- Added `ensureCorsHeaders()` helper to set CORS headers when `sendError` is called directly from middleware
- This ensures CORS headers are set even when errors occur in middleware (like `verifyToken`)

### 3. Auth Middleware (`api/src/middleware/authMiddleware.js`)
- Updated all `sendError()` calls to include the `req` parameter
- Added JWT_SECRET validation check
- Added better error logging for JWT verification errors

### 4. CORS Configuration (`api/src/server.js`)
- Improved CORS error handling (changed from throwing error to returning false)
- Added explicit OPTIONS handler for preflight requests
- Added logging for allowed origins in production
- Set `optionsSuccessStatus: 200` for legacy browser compatibility

## Vercel Configuration Required

### Environment Variables
You **MUST** set the following environment variable in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

```
FRONTEND_URL=https://offer-us.vercel.app
```

**Important Notes:**
- Use the exact URL of your frontend deployment (no trailing slash)
- If you have multiple frontend URLs, use comma-separated values: `https://offer-us.vercel.app,https://staging.yourapp.com`
- Make sure to set this for **Production**, **Preview**, and **Development** environments as needed

### Other Required Environment Variables
Make sure these are also set in Vercel:
- `MONGODB_URI` or `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRE` - Token expiration (default: "30d")
- `NODE_ENV` - Should be "production" (automatically set by Vercel)

## Testing the Fix

After deploying with these changes:

1. **Check CORS Headers**: Open browser DevTools → Network tab → Make a request to `/api/auth/me`
   - Look for `Access-Control-Allow-Origin` header in the response
   - Should show: `Access-Control-Allow-Origin: https://offer-us.vercel.app`

2. **Check Error Responses**: Even if you get a 500 error, you should now see:
   - CORS headers present in the response
   - Proper error message in the response body
   - No CORS policy error in the console

3. **Check Logs**: In Vercel dashboard → Functions → View logs
   - Look for CORS-related logs
   - Check for any database connection errors
   - Verify JWT_SECRET is configured

## Common Issues

### Issue: Still getting CORS errors
**Solution**: 
- Verify `FRONTEND_URL` is set correctly in Vercel environment variables
- Make sure there are no trailing slashes in the URL
- Check that the frontend URL matches exactly (including `https://`)

### Issue: 500 errors persist
**Solution**:
- Check Vercel function logs for the actual error
- Verify `MONGODB_URI` is set correctly
- Verify `JWT_SECRET` is set
- Check database connection is working

### Issue: Cookies not being sent
**Solution**:
- Verify `withCredentials: true` is set in frontend API client (already configured)
- Check that cookies are being set with `sameSite: "none"` and `secure: true` (handled automatically in production)

## Files Modified

1. `api/src/middleware/errorMiddleware.js` - Added CORS headers to error responses
2. `api/src/utils/responseFormat.js` - Added CORS header support to `sendError`
3. `api/src/middleware/authMiddleware.js` - Updated all error responses to include CORS headers
4. `api/src/server.js` - Improved CORS configuration

## Next Steps

1. ✅ Code changes are complete
2. ⚠️ **Set `FRONTEND_URL` environment variable in Vercel** (REQUIRED)
3. Deploy to Vercel
4. Test the `/api/auth/me` endpoint
5. Verify CORS headers are present in all responses

