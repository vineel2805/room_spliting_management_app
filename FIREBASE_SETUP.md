# Firebase Setup Guide for Split App

This guide will help you set up Firebase for the Split expense tracking app.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter a project name (e.g., "split-expense-app")
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

---

## Step 2: Register Your Web App

1. In Firebase Console, click on your project
2. Click the **Web icon** (</>) to add a web app
3. Enter an app nickname (e.g., "Split Web App")
4. **DO NOT** check "Firebase Hosting" (unless you want to deploy there)
5. Click **"Register app"**
6. You'll see your Firebase config - **copy these values!**

Your config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 3: Create Your .env File

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyB...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

---

## Step 4: Enable Firestore Database

1. In Firebase Console, go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
   - ⚠️ **Important**: Test mode allows anyone to read/write for 30 days
4. Select your preferred location (choose closest to your users)
5. Click **"Enable"**

---

## Step 5: Set Up Firestore Security Rules (For Production)

After testing, update your Firestore rules for security:

1. Go to **Firestore Database** → **"Rules"** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms - anyone can read/write for now (add auth later)
    match /rooms/{roomId} {
      allow read, write: if true;
    }
    
    // Members - anyone can read/write
    match /members/{memberId} {
      allow read, write: if true;
    }
    
    // Expenses - anyone can read/write
    match /expenses/{expenseId} {
      allow read, write: if true;
    }
    
    // Expense beneficiaries
    match /expense_beneficiaries/{docId} {
      allow read, write: if true;
    }
    
    // Expense payments
    match /expense_payments/{docId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 6: Create Firestore Indexes (If Needed)

The app uses queries that might need indexes. If you see an error in the browser console with a link to create an index, click that link to auto-create it.

Common indexes needed:
- `expenses` collection: `roomId` (Ascending) + `date` (Descending)

To create manually:
1. Go to **Firestore Database** → **"Indexes"** tab
2. Click **"Create index"**
3. Collection ID: `expenses`
4. Fields: 
   - `roomId` - Ascending
   - `date` - Descending
5. Click **"Create"**

---

## Step 7: Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Database Structure

The app uses these Firestore collections:

### `rooms`
```javascript
{
  name: "Apartment 2024",
  createdAt: Timestamp
}
```

### `members`
```javascript
{
  roomId: "room_id_here",
  name: "John",
  createdAt: Timestamp
}
```

### `expenses`
```javascript
{
  roomId: "room_id_here",
  itemName: "Electricity Bill",
  totalAmount: 2500,
  date: Timestamp,
  createdAt: Timestamp
}
```

### `expense_beneficiaries`
```javascript
{
  expenseId: "expense_id_here",
  memberId: "member_id_here"
}
```

### `expense_payments`
```javascript
{
  expenseId: "expense_id_here",
  memberId: "member_id_here",
  paidAmount: 2500
}
```

---

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check that your `.env` file has correct values
- Make sure you restart the dev server after changing `.env`

### "Missing or insufficient permissions"
- Check Firestore security rules
- Make sure Firestore is enabled in your project

### "Failed to get document because the client is offline"
- Check your internet connection
- Verify Firebase project settings

### Queries not working / Index errors
- Click the link in the console error to create the required index
- Wait a few minutes for the index to build

---

## Optional: Enable Authentication (Future)

To add user authentication:

1. Go to **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Enable **"Email/Password"** or **"Google"** sign-in
4. Update your app to use Firebase Auth

---

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
