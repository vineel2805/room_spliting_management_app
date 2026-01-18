## Split - Expense Sharing App

A modern, Splitwise-like expense sharing application built with React and Tailwind CSS.

## Features

- **Home/Dashboard**: View monthly summary with stats cards (You Owe / Owes You) and expense groups list
- **Group Detail**: See full room view with balances and expense history
- **Add Expense**: Clean form to add expenses with validation
- **Members**: Manage group members with add/remove functionality
- **Settlement**: Auto-generated settlement suggestions

## Design System

### Colors
- **Primary Gradient**: #FF7A45 (soft coral) → #FFB347 (warm amber)
- **Background**: #F9FAFB (light gray)
- **Money Colors**:
  - You get money: #16A34A (green)
  - You owe money: #DC2626 (red)
  - Neutral: #64748B (slate)
- **Accent**: #FB923C (orange)

### Typography
- Font: Inter
- Title: 20–22px
- Card title: 16px
- Body: 14px
- Amount: 18–20px (bold)

### Spacing
- Padding: 16px
- Card radius: 16–20px
- Gap between cards: 12px
- Bottom nav height: 64px

## Tech Stack

- React 18
- React Router DOM
- Tailwind CSS
- Vite

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/      # Reusable UI components
  │   ├── GradientHeader.jsx
  │   ├── StatCard.jsx
  │   ├── ExpenseCard.jsx
  │   ├── MemberRow.jsx
  │   ├── AmountBadge.jsx
  │   ├── PrimaryButton.jsx
  │   ├── FloatingAddButton.jsx
  │   └── BottomNav.jsx
  ├── screens/         # Page components
  │   ├── HomeScreen.jsx
  │   ├── GroupDetailScreen.jsx
  │   ├── AddExpenseScreen.jsx
  │   ├── MembersScreen.jsx
  │   └── SettlementScreen.jsx
  ├── App.jsx          # Main app with routing
  ├── main.jsx         # Entry point
  └── index.css        # Global styles
```

## Navigation

Bottom navigation bar with:
- Home
- Groups
- ➕ Add Expense (center, highlighted)
- Members
- Profile
