# Supabase Production Setup for AtlasTrail

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Fill in project name (e.g. `atlastrail`), set a strong database password, choose a region closest to your users.
4. Click **Create Project** and wait ~2 minutes for it to provision.

---

## 2. Create the Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- trips table
create table trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  description text default '',
  countries_visited text[] default '{}',
  connect_pins_with_line boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- pins table
create table pins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  order_index integer default 0,
  title text default '',
  visit_date date,
  latitude double precision not null,
  longitude double precision not null,
  city text default '',
  province text default '',
  country text default '',
  lodging_name text default '',
  attractions text default '',
  food_drink text default '',
  tips_notes text default '',
  image_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- user_settings table
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'light',
  map_style text default 'default',
  created_at timestamptz default now()
);
```

---

## 3. Enable Row Level Security (RLS)

Run this in the SQL Editor to lock down data per user:

```sql
-- Enable RLS
alter table trips enable row level security;
alter table pins enable row level security;
alter table user_settings enable row level security;

-- trips policies
create policy "Users can CRUD own trips"
  on trips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- pins policies
create policy "Users can CRUD own pins"
  on pins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_settings policies
create policy "Users can CRUD own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 4. Get Your API Keys

1. In Supabase dashboard go to **Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 5. Configure Environment Variables

### Local development (`.env.local`)

```env
NEXT_PUBLIC_APP_MODE=production
NEXT_PUBLIC_DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Vercel (production)

1. Go to your **Vercel project → Settings → Environment Variables**.
2. Add the same four variables above.
3. Redeploy from the Vercel dashboard (or push a commit).

---

## 6. Configure Auth Settings in Supabase

1. Go to **Authentication → Settings**.
2. Under **Site URL**, set your Vercel URL: `https://atlas-trails.vercel.app`
3. Under **Redirect URLs**, add:
   - `https://atlas-trails.vercel.app/**`
   - `http://localhost:3000/**` (for local dev)
4. Enable **Email** provider under **Authentication → Providers → Email**.
5. Optionally disable "Confirm email" for easier local testing (**Auth → Settings → "Enable email confirmations"** toggle off).

---

## 7. (Optional) Add the Demo User

To create the demo user in Supabase:

1. Go to **Authentication → Users → Invite user**.
2. Invite `demo@atlastrail.app`.
3. Or use the SQL editor:

```sql
-- This requires Supabase service_role key, run via the SQL editor
select * from auth.users where email = 'demo@atlastrail.app';
```

Or just let users sign up normally — the demo account is only pre-seeded in local mode.

---

## 8. Verify

Run locally with Supabase credentials:

```bash
npm run dev
# Sign up with a new account → data should appear in your Supabase dashboard under Table Editor
```

---

## Summary Checklist

- [ ] Supabase project created
- [ ] SQL tables created (`trips`, `pins`, `user_settings`)
- [ ] Row Level Security enabled with policies
- [ ] API keys copied to `.env.local`
- [ ] Vercel env vars set
- [ ] Auth redirect URLs configured
- [ ] Test sign-up works and data appears in Supabase dashboard
