# Portfolito — Resume to Portfolio Generator

Portfolito is a full-stack web application that transforms your resume PDF into a stunning, shareable personal portfolio website in seconds — powered by Google Gemini AI.

---

## How It Works

1. Upload your resume (PDF or TXT)
2. Gemini AI extracts and structures your data — name, experience, skills, education, projects
3. A beautiful portfolio is generated instantly
4. Your portfolio is saved to MongoDB and gets a unique shareable URL
5. Share it anywhere — LinkedIn, Twitter, WhatsApp, or just copy the link

---

## Features

- **AI-Powered Parsing** — Uses Google Gemini 1.5 Flash to accurately extract structured data from any resume format
- **Resume Validation** — Two-stage validation (heuristic + Gemini) ensures only actual resumes are processed
- **Shareable URLs** — Every portfolio gets a unique URL like `/portfolio/<uuid>` stored in MongoDB
- **Social Sharing** — Built-in share panel for LinkedIn, Twitter, Facebook, and WhatsApp
- **Live Processing Log** — Real-time log panel shows exactly what's happening during processing
- **Export JSON** — Download the raw extracted data as a JSON file
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Dark Theme** — Premium glassmorphism UI with smooth animations

---

## Tech Stack

### Frontend
- React (Create React App)
- Vanilla CSS with CSS custom properties
- pdf.js for client-side PDF text extraction
- Lucide React for icons
- Google Gemini API for AI parsing

### Backend
- Node.js + Express
- MongoDB + Mongoose
- UUID for unique portfolio identifiers
- CORS enabled for local development

---

## Project Structure

```
portfolito/
├── frontend/          # React application
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── sections/
│       └── utils/
│           ├── geminiParser.js     # Gemini API integration
│           ├── pdfExtractor.js     # PDF text extraction
│           ├── resumeValidator.js  # Resume validation logic
│           ├── portfolioService.js # Backend API calls
│           ├── mockParser.js       # Fallback heuristic parser
│           └── logger.js           # Live log utility
└── backend/           # Node.js + Express API
    ├── models/
    │   └── Portfolio.js            # Mongoose schema
    └── routes/
        └── portfolio.js            # POST & GET endpoints
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key — free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/portfolito
```

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_API_URL=http://localhost:5000
```

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `REACT_APP_GEMINI_API_KEY` | frontend/.env | Google Gemini API key |
| `REACT_APP_API_URL` | frontend/.env | Backend base URL |
| `PORT` | backend/.env | Express server port |
| `MONGO_URI` | backend/.env | MongoDB connection string |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/portfolio` | Save parsed portfolio, returns UUID |
| `GET` | `/api/portfolio/:uuid` | Fetch portfolio by UUID |
| `GET` | `/health` | Health check |

---

## Notes

- If no Gemini API key is set, the app falls back to a heuristic regex-based parser
- Shared portfolio URLs (`/portfolio/<uuid>`) fetch data directly from MongoDB — no AI calls, no extra charges
- For production deployment, configure your web server to serve `index.html` for all frontend routes
