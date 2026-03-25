# Two fixes applied — read this first

## What was fixed

### Fix 1 — Public visitors no longer see admin tabs
The app now shows only **Fixtures & Results** and **Leaderboard** to anyone visiting the URL.
The **Record match** and **Players** tabs only appear after signing in as admin.
An "Admin sign in" button sits in the top-right corner.

### Fix 2 — Invite email pointed to localhost
When Supabase sends invite emails, it uses the Site URL configured in your project.
You need to update this to your Vercel URL.

---

## Action required in Supabase (2 minutes)

1. Go to **supabase.com** → your project
2. Click **Authentication** in the left sidebar
3. Click **URL Configuration**
4. Change **Site URL** from `http://localhost:3000` to:
   ```
   https://ekpb.vercel.app
   ```
5. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://ekpb.vercel.app
   ```
6. Click **Save**

Future invite emails will now link directly to your live site.

---

## Re-invite yourself (since the old link expired)

The invite link you received has expired (they last 1 hour).
Go back to Supabase → **Authentication → Users**, find your email, and click **Send invite** again.
This time the link will go to `https://ekpb.vercel.app` and you'll see the "Set your admin password" screen.

---

## Deploy the updated code

```bash
git add pages/index.js
git commit -m "Add auth guard — hide admin tabs from public"
git push
```

Vercel will redeploy in about 60 seconds.

---

## How it works now

| Who visits | What they see |
|---|---|
| Anyone with the URL | Fixtures & Results + Leaderboard only |
| Admin (signed in) | All 4 tabs including Record match + Players |

Admins sign in via the button in the top-right corner.
Sign out returns them to the public view.
