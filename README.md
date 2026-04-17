# LetLaw — UK Landlord Management Platform

A full-stack property management web app built for UK landlords. Tracks properties, tenancies, finances, and generates legally-required documents — with AI-assisted clause customisation and Making Tax Digital (MTD) submission readiness.

**Live demo:** https://letlaw.netlify.app

---

## Features

| Feature | Description |
|---|---|
| **Property dashboard** | Overview of all properties, occupancy, and rental income |
| **Tenancy management** | Tenant details, lease dates, rent tracking |
| **Financial tracking** | Income/expense ledger per property; MTD-ready summaries |
| **Portfolio finances** | Aggregated P&L across all properties |
| **MTD automation** | Quarterly self-assessment figures formatted for HMRC submission |
| **RRA Document Generator** | Legally-required documents pre-filled from tenancy data |
| **AI clause customisation** | Claude AI generates bespoke clauses for tenancy documents |
| **Print-ready documents** | Clean print/PDF output via `@media print` — no PDF library needed |
| **Demo mode** | Pre-seeded demo data with a banner explaining the content |

### RRA Documents included
1. **RRA Information Sheet** — required for all new tenancies under the Renters' Rights Act
2. **Written Tenancy Terms** — prescribed information and terms of the tenancy
3. **Section 13 Notice** — rent increase notice with correct statutory wording
4. **Right-to-Rent Record** — document check log for Home Office compliance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma 7 (`@prisma/adapter-libsql`) |
| Database (prod) | Turso (hosted libsql) |
| Database (local) | SQLite via `file:./dev.db` |
| AI | Anthropic Claude (`claude-opus-4-5`) via `@anthropic-ai/sdk` |
| Hosting | Netlify (`@netlify/plugin-nextjs`) |
| Auth | NextAuth.js (credentials provider) |

---

## Local Development

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/DMFP13/letlaw.git
cd letlaw

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.example .env.local
# Edit .env.local — see Environment Variables below

# 4. Generate Prisma client
npx prisma generate

# 5. Apply database migrations (creates dev.db)
npx prisma migrate dev

# 6. Seed demo data
npx prisma db seed

# 7. Start dev server
npm run dev
```

Open http://localhost:3000

**Demo login:** `demo@letlaw.co.uk` / `demo1234`

---

## Environment Variables

### `.env.local` (local development)

```env
# Database — leave blank to use local SQLite (dev.db)
# TURSO_DATABASE_URL=
# TURSO_AUTH_TOKEN=

# NextAuth
NEXTAUTH_SECRET=any-random-string-32-chars
NEXTAUTH_URL=http://localhost:3000

# AI clause generation (optional — app works without it)
# ANTHROPIC_API_KEY=sk-ant-...
```

### Netlify environment variables (production)

Set these in Netlify → Site settings → Environment variables:

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` (use `libsql://`, NOT `https://`) |
| `TURSO_AUTH_TOKEN` | JWT token from Turso dashboard |
| `NEXTAUTH_SECRET` | Random 32+ char secret |
| `NEXTAUTH_URL` | `https://letlaw.netlify.app` |
| `ANTHROPIC_API_KEY` | Optional — enables AI clause generation |

> **Important:** Use `libsql://` not `https://` for the Turso URL. The `https://` transport doesn't reliably commit Prisma transactions.

---

## Netlify Deployment

### First-time setup

1. Push code to GitHub (`git push origin main`)
2. Connect GitHub repo to Netlify (or use `netlify link`)
3. Set all environment variables in Netlify dashboard
4. Run the migration against Turso (one-time):
   ```bash
   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx ts-node scripts/migrate-turso.ts
   ```
5. Seed the Turso database (one-time):
   ```bash
   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx prisma db seed
   ```
6. Deploy:
   ```bash
   netlify deploy --build --prod
   ```

### Subsequent deploys

```bash
netlify deploy --build --prod
```

The build command in `netlify.toml` handles everything:
```
node scripts/ensure-linux-binary.js && npx prisma generate && npm run build
```

### Linux binary note

macOS doesn't install the `@libsql/linux-x64-gnu` optional dependency. `scripts/ensure-linux-binary.js` downloads it automatically before every build. This is permanent and baked into `netlify.toml` — no manual action needed.

---

## Database: Applying migrations to Turso

Prisma's `migrate deploy` command doesn't support `libsql://` URLs. Use the custom script instead:

```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx ts-node scripts/migrate-turso.ts
```

This script reads every SQL file from `prisma/migrations/` and applies them directly via `@libsql/client`.

---

## Project Structure

```
letlaw/
├── prisma/
│   ├── schema.prisma          # DB schema (User, Property, Tenancy, Transaction, Document)
│   ├── seed.ts                # Demo data seeder
│   └── migrations/            # SQL migration files
├── scripts/
│   ├── ensure-linux-binary.js # Downloads @libsql/linux-x64-gnu for Netlify builds
│   └── migrate-turso.ts       # Applies migrations to Turso
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/     # Portfolio overview
│   │   │   ├── properties/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx              # Property detail
│   │   │   │       ├── tenancy/
│   │   │   │       │   ├── page.tsx          # Tenancy management + RRA panel
│   │   │   │       │   └── documents/
│   │   │   │       │       ├── page.tsx      # Document hub (4 cards)
│   │   │   │       │       └── [type]/
│   │   │   │       │           ├── page.tsx          # Document generator (pre-filled)
│   │   │   │       │           ├── AiClausePanel.tsx # AI clause input/output
│   │   │   │       │           └── PrintButton.tsx   # window.print() wrapper
│   │   │   │       └── finances/             # Property P&L
│   │   │   ├── finances/      # Portfolio finances
│   │   │   └── mtd/           # MTD quarterly summaries
│   │   └── page.tsx           # Landing page
│   └── lib/
│       ├── db.ts              # Prisma client (Turso or local SQLite)
│       ├── document-types.ts  # RRA document metadata
│       └── ai-document-actions.ts  # Server action: Claude API clause generation
├── netlify.toml               # Build config
└── .env.local                 # Local env vars (not committed)
```

---

## Demo Data

The seeded demo includes:

| Data | Details |
|---|---|
| **User** | `demo@letlaw.co.uk` / `demo1234` |
| **3 properties** | 12 Maple Street (occupied), 7 Oak Avenue (occupied), 3 Birch Lane (vacant) |
| **2 active tenancies** | Priya Sharma at Maple St, James & Sarah Collins at Oak Ave |
| **25 transactions** | Mix of rent income, maintenance, insurance, and utilities across all properties |
| **Documents** | RRA Info Sheet issued for Priya Sharma's tenancy |

---

## Known Issues / Future Work

- **CI/CD via GitHub → Netlify** would make builds run on Linux natively, eliminating the `ensure-linux-binary.js` workaround entirely
- **ANTHROPIC_API_KEY** not set on the live demo — AI clause panel shows an informative message but doesn't generate clauses
- **MTD direct submission** — figures are formatted correctly but actual HMRC API integration is a future milestone
- **Document storage** — generated documents are tracked in the DB as issued (date recorded) but not stored as files; future work would save PDFs to object storage (e.g. S3/Cloudflare R2)
- **Email notifications** — lease expiry reminders, rent due alerts

---

## Services & Credentials Reference

| Service | URL | Notes |
|---|---|---|
| Netlify | https://app.netlify.com | Hosts the app; env vars set here |
| Turso | https://app.turso.tech | Production database |
| GitHub | https://github.com/DMFP13/letlaw | Source code |
| Anthropic | https://console.anthropic.com | API key for AI clause generation |

---

## Picking this up in a new session

1. Open the repo in Cursor/VS Code: `cd "/Users/mac1/Property App/letlaw"`
2. Check the latest state: `git log --oneline -10`
3. Run locally: `npm run dev` (uses local SQLite — no env vars needed)
4. To deploy: set env vars in shell and run `netlify deploy --build --prod`
5. This README covers everything needed to resume any part of the project
