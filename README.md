# Split - Expense Sharing App

A modern, full-featured expense sharing application built with React, Firebase, and Tailwind CSS. Perfect for tracking shared expenses among friends, roommates, or travel groups.

## ✨ Features

### 🔐 Authentication
- **Google Sign-In**: Secure authentication via Firebase Auth
- **Protected Routes**: All app routes require authentication
- **Persistent Sessions**: Stay logged in across browser sessions

### 🏠 Rooms (Groups)
- **Create Rooms**: Create expense groups with custom names and passwords
- **Room Codes**: Shareable 6-character codes for easy joining
- **Join Rooms**: Join existing rooms with code + password
- **Multi-Room Support**: Participate in multiple expense groups
- **Leave Rooms**: Leave rooms when no longer needed

### 💰 Expense Management
- **Add Expenses**: Track shared expenses with detailed information
- **Multiple Payers**: Support for single or multiple payers per expense
- **Flexible Splitting**: 
  - Equal split among selected members
  - Custom/unequal split with specific amounts per person
- **Monthly Filtering**: View expenses by month and year
- **Expense History**: Full list of all expenses with details
- **Delete Expenses**: Remove incorrect or cancelled expenses

### 👥 Members
- **Auto-Join**: Members added automatically when joining a room
- **Member Profiles**: Display name, photo, and email from Google account
- **Balance Tracking**: Real-time balance calculation per member

### 📊 Dashboard & Analytics
- **Monthly Summary**: View total expenses for selected month
- **Member Balances**: See who owes and who is owed
- **Visual Indicators**: Color-coded amounts (green for credit, red for debit)
- **Member Detail Modal**: Click on members to see detailed breakdown

### 💸 Smart Settlements
- **Industry-Standard Algorithm**: 3-layer settlement model
  - Layer 1: Obligation Ledger (source of truth)
  - Layer 2: Net Balance Compression (cancels cycles)
  - Layer 3: Greedy Creditor-Debtor Settlement (minimum transactions)
- **Auto-Generated Suggestions**: Optimal settlement plan to clear all debts
- **Record Settlements**: Mark payments as settled
- **Settlement History**: Track all past settlements

### 👤 Profile
- **User Information**: View Google account details
- **Room Management**: See all joined rooms
- **Dark Mode**: Toggle between light and dark themes
- **Settlement History**: View personal settlement records
- **Sign Out**: Secure logout functionality

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **React Router DOM 6** | Client-side routing |
| **Tailwind CSS 3** | Utility-first styling |
| **Firebase Auth** | Google authentication |
| **Firebase Firestore** | NoSQL database |
| **Firebase Hosting** | Deployment |
| **Vite 5** | Build tool & dev server |
| **Recharts** | Data visualization |

## 📁 Project Structure

```
split/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AmountBadge.jsx       # Colored amount display
│   │   ├── BottomNav.jsx         # Bottom navigation bar
│   │   ├── ExpenseCard.jsx       # Expense list item card
│   │   ├── ExpenseDetailModal.jsx # Expense detail popup
│   │   ├── FloatingAddButton.jsx # FAB for adding expenses
│   │   ├── GradientHeader.jsx    # Gradient header component
│   │   ├── MemberDetailModal.jsx # Member balance breakdown
│   │   ├── MemberRow.jsx         # Member list item
│   │   ├── PrimaryButton.jsx     # Styled button component
│   │   └── StatCard.jsx          # Statistics display card
│   │
│   ├── config/
│   │   └── firebase.js           # Firebase initialization
│   │
│   ├── context/
│   │   ├── AuthContext.jsx       # Authentication state management
│   │   └── RoomContext.jsx       # Room & expense state management
│   │
│   ├── screens/              # Page components
│   │   ├── AddExpenseScreen.jsx  # Multi-step expense form
│   │   ├── ExpenseListScreen.jsx # All expenses list view
│   │   ├── GroupDetailScreen.jsx # Room detail view
│   │   ├── HomeScreen.jsx        # Main dashboard
│   │   ├── LoginScreen.jsx       # Google sign-in page
│   │   ├── MembersScreen.jsx     # Room members list
│   │   ├── ProfileScreen.jsx     # User profile & settings
│   │   └── SettlementScreen.jsx  # Settlement suggestions
│   │
│   ├── services/
│   │   ├── authService.js        # Auth & room code operations
│   │   ├── calculationService.js # Balance & settlement algorithms
│   │   └── firebaseService.js    # Firestore CRUD operations
│   │
│   ├── App.jsx               # Main app with routing
│   ├── index.css             # Global styles & Tailwind
│   └── main.jsx              # Entry point
│
├── firebase.json             # Firebase hosting config
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies & scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### 1. Clone the repository
```bash
git clone <repository-url>
cd split
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
Create a `.env` file in the root directory with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Start development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

### 6. Deploy to Firebase Hosting
```bash
firebase deploy
```

## 🎨 Design System

### Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#FF7A45` | Buttons, accents |
| Primary Gradient | `#FF7A45 → #FFB347` | Headers |
| Background | `#F9FAFB` | Page background |
| Credit (Green) | `#16A34A` | Positive balances |
| Debit (Red) | `#DC2626` | Negative balances |
| Neutral | `#64748B` | Muted text |

### Typography
- **Font**: Inter
- **Title**: 20–22px (semibold)
- **Card Title**: 16px (medium)
- **Body**: 14px (regular)
- **Amount**: 18–20px (bold)

### Spacing
- **Padding**: 16px (standard), 20px (cards)
- **Card Radius**: 16–20px
- **Gap**: 12px (between cards)
- **Bottom Nav Height**: 64px

## 🗄 Database Schema (Firestore)

### Collections
- `rooms` - Expense groups
- `members` - Room members (linked to users)
- `expenses` - Individual expenses
- `expense_beneficiaries` - Who shares the expense
- `expense_payments` - Who paid for the expense
- `settlements` - Recorded settlements

## 📱 Navigation

Bottom navigation bar with 5 tabs:
- 🏠 **Home** - Dashboard & room selection
- 📋 **Expenses** - Full expense list
- ➕ **Add** (center, highlighted) - Add new expense
- 👥 **Members** - Room members
- 👤 **Profile** - Settings & sign out

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.
