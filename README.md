# SplitEase - Smart Expense Splitting App

A full-stack expense splitting application built with **React.js**, **Tailwind CSS**, **Redux Toolkit**, and **Supabase**.

## 🚀 Features

### Core Modules
- **Authentication** - Register, Login, Logout, Forgot Password, Google Login (Supabase Auth)
- **Group Management** - Create, Edit, Delete groups; Invite/Remove members
- **Expense Management** - Full CRUD for expenses with category support
- **Expense Splitting** - Equal, Exact, Percentage, and Custom splits
- **Balance Calculation** - Real-time net balance calculation (Amount Paid - Amount Owed)
- **SettleUp Algorithm** - Optimized transaction minimization to settle debts
- **Dashboard** - Stats cards, monthly spending chart, category breakdown, group spending
- **Reports** - Daily/Weekly/Monthly/Custom filters with PDF & CSV export

### Advanced Features
- 🌓 Dark/Light Theme Toggle
- 📊 Interactive Charts (Chart.js)
- 📄 PDF Report Generation (jsPDF)
- 📁 CSV Export
- 🖼️ Profile Image Upload (Supabase Storage)
- 🔄 Real-Time Updates (Supabase Realtime)
- 🔒 Row Level Security (RLS) Policies
- 📱 Fully Responsive Design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 |
| Styling | Tailwind CSS 3 |
| State Management | Redux Toolkit |
| Routing | React Router v6 |
| Charts | Chart.js + react-chartjs-2 |
| Backend | Supabase (BaaS) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── Layout.jsx
│   │   └── Navbar.jsx
│   └── ui/
│       ├── EmptyState.jsx
│       ├── LoadingSpinner.jsx
│       └── Modal.jsx
├── lib/
│   └── supabase.js
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── groups/
│   │   ├── Groups.jsx
│   │   └── GroupDetails.jsx
│   ├── expenses/
│   │   ├── Expenses.jsx
│   │   ├── AddExpense.jsx
│   │   └── EditExpense.jsx
│   ├── Dashboard.jsx
│   ├── Settlements.jsx
│   ├── Reports.jsx
│   ├── Profile.jsx
│   └── Settings.jsx
├── store/
│   ├── index.js
│   └── slices/
│       ├── authSlice.js
│       ├── groupSlice.js
│       ├── expenseSlice.js
│       ├── settlementSlice.js
│       └── themeSlice.js
├── utils/
│   ├── splitCalculator.js
│   ├── settleUp.js
│   └── exportUtils.js
├── App.jsx
├── main.jsx
└── index.css
```

## ⚡ Setup Instructions

### 1. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Enable **Google OAuth** in Authentication > Providers (optional)
4. Copy your project URL and anon key

### 2. Environment Variables
Create a `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## 📊 Database Schema

- **users** - User profiles
- **groups** - Expense groups
- **group_members** - Group membership (Admin/Member roles)
- **expenses** - Expense records
- **expense_shares** - Individual share amounts per expense
- **settlements** - Payment settlement tracking
- **categories** - Expense categories

## 🧮 Splitting Algorithms

| Type | Description |
|------|-------------|
| Equal | `₹Amount / N members` |
| Exact | Manual amount per person (must total to expense) |
| Percentage | Each member gets a % (must total 100%) |
| Custom | Free-form amounts per member |

## 🤝 SettleUp Algorithm

Uses a greedy matching algorithm:
1. Calculate net balance for each member
2. Separate debtors (negative) and creditors (positive)
3. Sort both by amount (descending)
4. Match highest debtor with highest creditor
5. Create minimal settlement transactions

## 📝 License

This project is for educational purposes (FSD Training).
