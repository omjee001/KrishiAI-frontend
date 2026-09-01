# 🌾 KrishiAI — Smart Agricultural Direct-Trade Platform

KrishiAI connects farmers and consumers directly, eliminating intermediaries and empowering farmers with smart AI-assisted crop listing, pricing insights, order management, and real-time messaging.

---

## 🚀 Key Features

### 👨‍🌾 Farmer Workspace
- **Smart Crop Management**: List, edit, and manage crop listings with image upload & automatic optimization.
- **AI Listing Generator**: AI-powered crop descriptions, category recommendations, and price suggestions.
- **Incoming Order Fulfillment**: Accept, reject, or mark orders as delivered with instant status updates.
- **Direct Messaging**: Chat in real-time with prospective buyers with persistent conversation history and message deletion.
- **Crop Diagnostics & AI Tools**: Disease detection and smart price prediction tools.
- **Farmer Profile**: Customizable business name, farm size in acres, farming practices, and location.

### 🛒 Consumer Experience
- **Fresh Produce Marketplace**: Browse, filter by category (Vegetables, Fruits, Grains, Spices), and search by crop or location.
- **Direct Orders**: Place order requests directly with farmers with custom quantities.
- **Order Tracking**: Visual status timeline tracking (*Requested* → *Confirmed* → *Delivered*) and cancellation options.
- **Direct Farmer Inquiries**: Reach out to farmers directly from crop listings with pre-filled inquiry context.

### 🛡️ Admin & Security
- **Role-Based Access Control**: Protected routes and specialized interfaces for `FARMER`, `CONSUMER`, and `ADMIN`.
- **User & Inventory Directory**: Comprehensive user management and platform-wide crop moderation.
- **Full Offline / Mock Mode**: Integrated with persistent `localStorage` for complete standalone functionality without external backend dependency.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling & UI**: Bootstrap 5 + Bootstrap Icons
- **Routing**: React Router 7
- **HTTP & State**: Axios, Context API, LocalStorage persistence
- **Location Database**: `country-state-city`

---

## 💻 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔑 Demo Login Information

You can register a new Farmer or Consumer account, or log in with the following demo credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Farmer** | `ravi@farm.com` | `password123` |
| **Consumer** | `priya@example.com` | `password123` |
| **Admin** | `admin@krishiai.com` | `password123` |

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).

