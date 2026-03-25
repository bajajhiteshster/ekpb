# East Kilbride Pickleball Championship — Setup Guide

A complete guide to get your championship system live on the web, free of charge.

---

## What you'll need

- A free **GitHub** account → github.com
- A free **Supabase** account → supabase.com
- A free **Vercel** account → vercel.com
- The code files provided (ekpb folder)

Estimated time: **20–30 minutes**

---

## Step 1 — Create your GitHub repository

1. Go to **github.com** and sign in (or create a free account)
2. Click the **+** button (top right) → **New repository**
3. Name it `ekpb-championship`
4. Set it to **Private** (so only you can see the code)
5. Click **Create repository**

Now upload the code:

1. On your computer, open a terminal in the `ekpb` folder
2. Run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit — EK Pickleball Championship"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ekpb-championship.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 2 — Set up Supabase (your database)

### 2a. Create a project

1. Go to **supabase.com** and sign in
2. Click **New project**
3. Name it `ekpb-championship`
4. Choose a strong database password (save it somewhere safe)
5. Region: **Europe West** (closest to East Kilbride)
6. Click **Create new project** — takes about 2 minutes to spin up

### 2b. Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase_schema.sql` from your ekpb folder
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (green button)
6. You should see "Success. No rows returned" — that's correct!

### 2c. Get your API keys

1. In Supabase, click **Project Settings** (gear icon, bottom left)
2. Click **API**
3. Copy two values — you'll need them in Step 3:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 3 — Deploy on Vercel

### 3a. Import your GitHub repo

1. Go to **vercel.com** and sign in (use your GitHub account for easy linking)
2. Click **Add New → Project**
3. Find and select `ekpb-championship` from your GitHub repos
4. Click **Import**

### 3b. Add your Supabase environment variables

Before clicking Deploy, scroll down to **Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 2c |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 2c |

Click **Add** after each one.

### 3c. Deploy!

1. Click **Deploy**
2. Wait 1–2 minutes while Vercel builds your app
3. When done, you'll see a URL like `ekpb-championship.vercel.app`

**That's your live app — share this URL with your group!**

---

## Step 4 — First-time setup in the app

1. Open your Vercel URL in a browser
2. Go to the **Players** tab
3. Add all your members (first name, last name, skill level)
4. Go to **Record match** → **Schedule a fixture**
5. Pick the match type, date, players, and click **Add fixture**

The **Fixtures & Results** tab is the public view — anyone with the URL can see it.

---

## Step 5 — Give others access (optional)

### View-only access (most members)
Just share the URL. The Fixtures & Results and Leaderboard tabs are fully public — no login needed.

### Admin access (committee members who record results)
Currently all write operations require a Supabase logged-in user. To set up admin logins:

1. In Supabase, go to **Authentication → Users**
2. Click **Invite user** and enter the admin's email
3. They'll receive an email to set a password
4. You'll need to add a login page to the app — let Claude know and it can generate one for you

---

## Making updates

Whenever you change the code:

```bash
git add .
git commit -m "describe what you changed"
git push
```

Vercel automatically detects the push and redeploys in about 60 seconds.

---

## Custom domain (optional)

Want `ekpickleball.co.uk` instead of the Vercel URL?

1. Buy a domain from **Namecheap** or **123-reg** (~£10/year)
2. In Vercel: go to your project → **Settings → Domains**
3. Add your domain and follow the DNS instructions
4. Takes 10–30 minutes to propagate

---

## Troubleshooting

**App shows "loading" forever**
→ Your environment variables are probably missing or wrong. Go to Vercel → Project → Settings → Environment Variables and check them.

**"Policy violation" errors when adding data**
→ Your Supabase RLS policies are working correctly but you need to be authenticated. For now, you can temporarily disable RLS in Supabase SQL Editor:
```sql
alter table players  disable row level security;
alter table fixtures disable row level security;
alter table results  disable row level security;
```
*Only do this on a private/internal tool — add auth before making it public.*

**Players not showing in dropdowns**
→ Add your players first in the Players tab before scheduling fixtures.

---

## Cost summary

| Service | Plan | Cost |
|---------|------|------|
| GitHub | Free | £0 |
| Supabase | Free tier (500MB, 50k rows) | £0 |
| Vercel | Hobby (unlimited deploys) | £0 |
| **Total** | | **£0/month** |

The free tiers are more than enough for a club championship of any size.

---

*Built for East Kilbride Pickleball Group · Questions? Ask Claude for help!*
