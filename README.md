# 💰 Magic Budget App

A gamified, zero-based budgeting application inspired by Dave Ramsey's "Baby Steps" philosophy. Built for speed, clarity, and "financial dopamine."

## 🌟 Key Features

### 1. The Magic Dashboard
- **Payday Magic**: A clear "Left to Budget" display that triggers your allocation flow.
- **Urgency Detection**: Automatically highlights bills due in the next 48 hours with a red glow.
- **Funding Priorities**: Visual progress bars for all active bills of the month.

## Docker

To run the application locally using Docker:

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
2.  Open [http://localhost:3001](http://localhost:3001).

*Note: This creates a production-like build served via Nginx.*

### 2. Allocation Engine
- **Smart Bill Detection**: 
  - **Required**: Bills due strictly between your current and next paycheck are highlighted as priority.
  - **Ghosted**: Future bills (due after next payday) appear faded (40% opacity) to reduce cognitive load.
- **Priority Logic**: Money is routed in a specific order:
  1.  **Fixed Bills** (Must Pays)
  2.  **Annual Drips** (Sinking Funds capable of auto-piloting yearly expenses)
  3.  **Debt Minimums**
  4.  **Emergency Fund** (If below goal)
  5.  **Snowball Power** (Surplus cash to debts)
  6.  **Lifestyle Funds** (Discretionary)
- **History Tracking**: Every confirmed allocation creates a permanent snapshot of your financial state in `paycheck_history`.

### 3. Specialty Modules (Baby Steps)
- **🛡️ Emergency Fund Fortress (Baby Step 1)**:
  - A secure "Vault" UI for your $1,000 starter fund.
  - **High-Friction Unlock**: Requires typing "EMERGENCY" to withdraw.
  - **Celebration Mode**: Confetti and badges upon reaching the goal.
  
- **❄️ Debt Snowball (Baby Step 2)**:
  - **Master View**: Auto-sorts debts from smallest to largest balance.
  - **Snowball Momentum**: Visual tracker of total debt eliminated.
  - **Target Focus**: Highlights the current "Attack Target" debt.

### 4. Sinking Funds & Savings
- **Circular Progress**: Visual rings for every savings goal (Groceries, Vacation, Car Repair).
- **Reallocation**: "Whack-a-Mole" style money movement to cover overspending instantly.

### 5. Collaboration & Security
- **Shared Budgeting**: Invite partners by email directly from the **Settings** menu.
- **Role-Based Access**: Secure Firestore rules ensure access is granted only to the owner and listed collaborators.
- **Account Control**: Full profile management and a high-friction "Delete Account" feature for complete data removal.

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS (Custom Dark Theme: Deep Charcoal & Emerald)
- **State Management**: Zustand
- **Backend / Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Icons**: Material Symbols (Google)
- **Fonts**: Manrope (UI) & Outfit (Display)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd budget-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Ensure your `.firebaserc` matches your project ID.
   - Create a `.env.local` file with your Firebase config keys:
     ```
     VITE_FIREBASE_API_KEY=your_key
     VITE_FIREBASE_AUTH_DOMAIN=your_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

## 📦 Deployment

This project is configured for **Firebase Hosting**.

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   firebase deploy
   ```

## 📂 Project Structure

```
src/
├── components/        # Shared UI components (Layout, Nav, etc.)
├── features/         # Feature-based architecture
│   ├── allocation/   # Logic for Payday Magic
│   ├── auth/         # Login & Protection
│   ├── budget/       # Zero-based planning view
│   ├── dashboard/    # Main HUD
│   ├── debt/         # Snowball Tracker
│   ├── funds/        # Sinking Funds & Fortress
│   └── onboarding/   # Initial setup flow
├── store/            # Global Zustand store & Types
└── utils/            # Helper functions
```

## 🎨 Design System

- **Colors**:
  - `bg-background-dark`: `#0a0f1c` (Main Background)
  - `bg-surface-dark`: `#131b2c` (Cards)
  - `text-primary`: `#2dd4bf` (Teal - Success/Action)
  - `text-danger`: `#ef4444` (Red - Alerts)

- **Philosophy**:
  - **Dark Mode Only**: For a premium, dashboard feel.
  - **Glassmorphism**: Subtle translucency for depth.
  - **Positive Reinforcement**: Celebrations for financial wins.
