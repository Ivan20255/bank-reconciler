# Bank Reconciler

Compare bank statements with Jobber expenses. Identify unreported transactions and send SMS reminders to employees.

## Features

- **Upload Bank CSV** - Import bank transactions
- **Upload Jobber CSV** - Import Jobber expense reports  
- **Auto-matching** - Matches transactions by amount and description
- **Red highlighting** - Unreported transactions shown in red
- **Employee directory** - Manage employee contacts
- **SMS reminders** - One-click SMS to employees for missing receipts
- **Mobile friendly** - Works on phone, tablet, and desktop

## Running on Replit

1. Import from GitHub: `https://github.com/Ivan20255/match`
2. Wait for dependencies to install (or run `npm install`)
3. Click **"Run"** (green button)
4. Replit will give you a live URL

## CSV Format

**Bank CSV columns:**
- `date` or `transaction_date`
- `description` or `payee` or `merchant`
- `amount` or `debit`

**Jobber CSV columns:**
- `date` or `expense_date`
- `description` or `vendor` or `category`
- `amount` or `total`

## Mobile Usage

The app is fully responsive:
- **Desktop**: Full table view with all columns
- **Mobile**: Card-based layout with large touch targets (44px min)
- **Navigation**: Tab-based mobile menu

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons
