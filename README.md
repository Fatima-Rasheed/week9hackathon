# 🏥 HealthCare Store

A full-stack healthcare e-commerce app with AI-powered product search and chatbot support.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| AI | OpenAI GPT-4o-mini |

## Features

- **Authentication** — JWT-based signup/login with protected routes
- **Product Listing** — Browse 20 healthcare products with category filters
- **Normal Search** — Instant title/tag-based search with debounce
- **AI Intent Search** — Describe a health concern → AI extracts keywords → DB query
- **AI Chatbot** — LangGraph-style 3-node pipeline for product recommendations

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017 (or update `MONGODB_URI` in `backend/.env`)
- OpenAI API key

### 1. Configure environment

Edit `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=your_secret_here
OPENAI_API_KEY=sk-your-openai-key-here
```

### 2. Seed the database

```bash
cd backend
npm run seed
```

### 3. Start the backend

```bash
cd backend
npm run start:dev
# Runs on http://localhost:3001/api
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 5. Open the app

Navigate to `http://localhost:3000` — you'll be redirected to login.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/products` | Yes | All products |
| GET | `/api/products/categories` | Yes | All categories |
| GET | `/api/products/search?q=...&type=normal` | Yes | Normal search |
| GET | `/api/products/search?q=...&type=ai` | Yes | AI intent search |
| POST | `/api/chat/message` | Yes | Chat with AI advisor |

## AI Architecture

### Intent Search (2-step)
```
User query → OpenAI extracts medical keywords → MongoDB query on tags/aiKeywords
```

### Chatbot (LangGraph-style 3 nodes)
```
Node 1: Classify intent (product query vs general question)
Node 2: Fetch relevant products from MongoDB
Node 3: Generate response with product context via OpenAI
```

## Project Structure

```
healthcare-app/
├── backend/
│   └── src/
│       ├── auth/          # JWT auth module
│       ├── products/      # Products + search
│       ├── chat/          # AI chatbot
│       └── seed.ts        # Database seeder
└── frontend/
    ├── app/
    │   ├── login/         # Login page
    │   ├── signup/        # Signup page
    │   └── products/      # Main product page
    ├── components/
    │   ├── ProductCard.tsx
    │   ├── ChatBot.tsx
    │   └── Navbar.tsx
    └── lib/
        ├── api.ts         # Axios instance
        └── auth.ts        # Auth helpers
```
