# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session

```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API

```
curl -X GET "https://your-app.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

curl -X GET "https://your-app.com/api/collections" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

curl -X POST "https://your-app.com/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"name": "Test Collection"}'
```

## Step 3: Browser Testing

```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://your-app.com")
```

## Checklist
- User document has user_id field (custom UUID; MongoDB's _id separate)
- Session user_id matches user.user_id exactly
- All queries use `{"_id": 0}` projection
- Backend queries use user_id (not _id or id)
- /api/auth/me returns user data (not 401/404)
- Browser loads dashboard (not login page)
- Callback detection uses `useLocation().hash`

## Success
- /api/auth/me returns user data
- Dashboard loads without redirect
- CRUD operations work

## Failure
- "User not found" errors
- 401 Unauthorized responses
- Redirect to login page
