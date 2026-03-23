# Lakshmi Technical Institute - Typing Test Platform

A full-stack web application for typing tests built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Sign up and log in with email and password
- **Dashboard**: View personal stats (Average WPM, Accuracy, Total Tests)
- **Typing Tests**: 10-minute typing test with real-time WPM and accuracy tracking
- **Multiple Languages**: Practice in English and Tamil
- **Difficulty Levels**: Junior (30 WPM target) and Senior (45 WPM target)
- **Leaderboard**: View top performers globally
- **Admin Panel**: Manage typing passages
- **Contact Us**: Easy contact form for users
- **Professional Design**: Blue/Indigo color palette with responsive layout

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. **Navigate to the project**
   ```bash
   cd website_2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Get your Supabase credentials from https://supabase.com/dashboard
   - Add your credentials to `.env.local`

### Database Setup

Create these tables in your Supabase project:

#### profiles table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  mobile_number TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### passages table
```sql
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### test_results table
```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  passage_id UUID NOT NULL REFERENCES passages(id),
  wpm INTEGER,
  accuracy INTEGER,
  strokes INTEGER,
  duration_seconds INTEGER,
  language TEXT,
  level TEXT,
  typed_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/               # Pages and routes
├── components/        # Reusable components
├── config/           # Configuration
└── context/          # React context
```

## Usage

### Users
1. Sign up with email, password, mobile number, and date of birth
2. Log in to dashboard
3. View stats and take typing tests
4. Check leaderboard

### Admin
- Admin email: admin@lakshmi.com
- Access admin panel from navbar to manage passages

## Technologies

- Next.js with TypeScript
- Supabase for auth and database
- Tailwind CSS for styling
- React Hook Form for forms

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_ADMIN_EMAIL=admin@lakshmi.com
```

## Support

For questions, contact: contact@lakshmitech.com
