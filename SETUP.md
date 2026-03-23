# Quick Setup Guide - Lakshmi Technical Institute Typing Test Platform

## Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Sign up or log in
3. Create a new project
4. Copy your:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Step 2: Set Up Database Tables

1. In Supabase, go to **SQL Editor**
2. Copy all content from `database-schema.sql` in the project root
3. Paste it into the SQL editor
4. Click "Run" to execute all tables and setup

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` file
2. Rename it to `.env.local`
3. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_ADMIN_EMAIL=admin@lakshmi.com
   ```

## Step 4: Install Dependencies and Run

```bash
npm install
npm run dev
```

Open browser to http://localhost:3000

## Step 5: Test the Application

### Create Test User Account
1. Click "Sign Up"
2. Fill in all fields:
   - Full Name
   - Email
   - Password (min 6 chars)
   - Mobile Number
   - Date of Birth
3. Click "Sign Up"

### Test Admin Features (Optional)
1. Sign up with email: `admin@lakshmi.com`
2. Log in
3. Click "Admin Panel" in navbar
4. Add test passages for different languages and levels

### Test Typing Test
1. Go to Dashboard
2. Click "Start English Test" or use Typing Tests menu
3. Click "Start Test" button
4. Type in the text area
5. Let timer run or click "Submit Test"
6. View results

### Check Leaderboard
1. Click "Leaderboard" in navbar
2. See all users' ranking by average WPM

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run dev
```

### Supabase connection issues
- Verify `.env.local` has correct credentials
- Check that Supabase project is active
- Confirm tables exist in Supabase

### Auth not working
- Ensure email confirmation is optional in Supabase Auth settings
- Check that profiles table exists

### Passages not loading
- Make sure you added passages in Admin Panel
- Verify language and level match the test URL

## File Locations

- **Landing Page**: `src/app/page.tsx`
- **Auth Pages**: `src/app/signup/page.tsx`, `src/app/login/page.tsx`
- **Dashboard**: `src/app/dashboard/page.tsx`
- **Typing Test**: `src/app/typing-test/[language]/[level]/page.tsx`
- **Admin Panel**: `src/app/admin/page.tsx`
- **Leaderboard**: `src/app/leaderboard/page.tsx`
- **Contact**: `src/app/contact/page.tsx`
- **Navbar**: `src/components/Navbar.tsx`
- **Auth Context**: `src/context/AuthContext.tsx`
- **Supabase Config**: `src/config/supabase.ts`

## Key Features

✅ User Registration with 5 fields (Name, Email, Password, Mobile, DOB)
✅ Email/Password Authentication via Supabase
✅ Dashboard with real-time stats cards
✅ 10-minute typing tests
✅ Live WPM and Accuracy tracking
✅ Multi-language support (English, Tamil)
✅ Difficulty levels (Junior, Senior)
✅ Admin Panel for passage management
✅ Global Leaderboard
✅ Contact Us form
✅ Beautiful blue/indigo UI

## Default Admin Email

```
admin@lakshmi.com
```

Change this in `.env.local` if needed (NEXT_PUBLIC_ADMIN_EMAIL)

## Support

For issues, check:
1. Console errors (F12 in browser)
2. Network tab (check API calls)
3. Supabase logs in dashboard
4. Terminal output where `npm run dev` is running
