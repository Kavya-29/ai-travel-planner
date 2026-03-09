# AI Travel Planner — Startup Guide

Follow these steps to get your full-stack AI Travel Planner up and running.

## 1. Prerequisites
- **Node.js** installed on your system.
- **MongoDB**: You need a running MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
- **Gemini API Key**: Obtain one from the [Google AI Studio](https://aistudio.google.com/).

## 2. Environment Configuration

### Backend Setup
1. Navigate to the `server` directory.
2. Create a file named `.env` based on the `.env.example`.
3. Fill in your details:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `JWT_SECRET`: Any random long string for security.

### Frontend Setup (Optional)
If you want to change the API URL, you can create a `.env` in the `client` folder:
- `VITE_API_URL=http://localhost:5000/api`

## 3. Installation & Running

### Step A: Server
Open a terminal in the `server` directory:
```bash
npm install
npm start
```

### Step B: Client
Open a new terminal in the `client` directory:
```bash
npm install
npm run dev
```

## 4. Usage
- Go to `http://localhost:5173` in your browser.
- **Register** as a "Guest" to plan trips or as an "Owner" to list properties.
- Use the **Language Switcher** in the Navbar to change languages.
- Click the **Floating Chatbot** icon for instant travel advice.
