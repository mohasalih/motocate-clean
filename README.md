# 🏍️ Moto Care Pro — Garage Management System

Full-stack garage management system built with **Next.js 14 + Supabase**.  
Live website in **under 10 minutes** following these steps.

---

## ✅ What's Included

| Page | Features |
|------|----------|
| 🏠 Dashboard | Revenue chart, active jobs, low stock alerts, quick actions |
| 🔧 Service Jobs | Add/edit jobs, auto next-service date, mechanic assignment |
| 🧾 Invoices | Create invoices, **edit line items**, **mark paid**, **process refunds** |
| 👥 Customers | Add/edit customers, full service history panel |
| 📊 Accounting | Sales income, purchase expenses, profit tracker |
| 📦 Inventory | Parts stock, low-stock alerts, restock modal |
| 👨‍🔧 Mechanics | Performance, **what they sold**, **what they used/bought** |
| 🔔 Reminders | Oil (30+ days), repeat customers (60+ days), upcoming service — all with **WhatsApp deep links** |
| 🔍 Inspection | 12-point checklist, saved to database, history view |
| 📅 Bookings | Add/confirm/complete/cancel appointments |
| ⚙️ Settings | Garage info, service intervals, user roles |

---

## 🚀 Deploy in 10 Minutes

### Step 1 — Create Supabase Project (free)

1. Go to **https://supabase.com** → Sign up → New Project
2. Choose a name e.g. `moto-care-pro`
3. Wait ~2 minutes for it to start
4. Go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → click **Run**
5. This creates all tables and seeds demo data

### Step 2 — Get your API Keys

In Supabase: **Settings → API**

Copy:
- `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/moto-care-pro.git
git push -u origin main
```

### Step 4 — Deploy to Vercel (free)

1. Go to **https://vercel.com** → New Project → Import your GitHub repo
2. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY     = eyJhbGciOi...
   NEXT_PUBLIC_GARAGE_NAME       = Your Garage Name
   ```
3. Click **Deploy**
4. ✅ Your site is live at `https://your-project.vercel.app`

---

## 💻 Run Locally

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📱 WhatsApp Integration

WhatsApp reminders use **wa.me deep links** — no API key needed.  
Clicking "Send WhatsApp" opens the WhatsApp app with a pre-filled message.  
For **bulk automated sending** (without clicking), you need Twilio or WhatsApp Business API.

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `customers` | Vehicle owners, service dates, oil dates |
| `jobs` | Service job cards |
| `invoices` | Bills with line items (JSON), payment status, refunds |
| `inventory` | Parts stock tracking |
| `purchases` | Parts bought from suppliers |
| `mechanics` | Staff profiles |
| `mechanic_transactions` | What each mechanic sold / used |
| `bookings` | Service appointments |
| `inspections` | Vehicle inspection reports |
| `service_history` | Historical service records |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Hosting**: Vercel (free)
- **Fonts**: Syne (display) + DM Sans (body) + JetBrains Mono

---

## 📞 Support

Built by Claude for Moto Care Pro, Chennai.  
All data is saved to your Supabase database in real time.
