# SRIF 2026 - Scientific Research & Innovation Forum

> AlMaarefa University - Scientific Research and Innovation Forum 2026

## 🚀 Features

- **Dynamic Backend** - Node.js + Express.js + PostgreSQL
- **Abstract Submissions** - Research & Innovation tracks with file uploads
- **Admin Dashboard** - JWT authentication, submission management, announcements
- **Bilingual Support** - English & Arabic (RTL support)
- **RESTful API** - Clean API architecture for all data operations
- **Responsive Design** - Mobile-first, modern UI

## 📋 Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| File Upload | Multer |
| Security | Helmet, CORS, Rate Limiting |
| Frontend | HTML5, CSS3, Vanilla JS |

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Clone repository
git clone <repo-url>
cd srif-2026

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Create database
psql -U postgres -c "CREATE DATABASE srif_2026;"

# Initialize database tables & seed data
npm run init-db

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `srif_2026` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `ADMIN_EMAIL` | Default admin email | `admin@um.edu.sa` |
| `ADMIN_PASSWORD` | Default admin password | `srif2026admin` |

## 📁 Project Structure

```
srif-2026/
├── admin/              # Admin panel (dashboard, login)
├── database/           # Database connection (db.js)
├── middleware/          # Auth middleware (JWT)
├── routes/             # API routes
│   ├── api.js          # Public API (settings, stats)
│   ├── admin.js        # Admin API (submissions, announcements)
│   ├── submissions.js  # Submission endpoints
│   └── contact.js      # Contact form API
├── scripts/            # DB init & migration scripts
├── uploads/            # Uploaded files
├── server.js           # Express server entry point
├── index.html          # Main website
├── submit-research.html
├── submit-innovation.html
└── railway.json        # Railway deployment config
```

## 🚀 Railway Deployment

1. Push code to GitHub
2. Connect repository to Railway
3. Add PostgreSQL service in Railway
4. Set environment variables (Railway auto-provides `DATABASE_URL`)
5. Deploy

## 📜 API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/settings` - Event settings
- `GET /api/affiliations` - Available affiliations
- `GET /api/announcements` - Published announcements
- `GET /api/stats` - Submission statistics
- `POST /api/submissions/research` - Submit research abstract
- `POST /api/submissions/innovation` - Submit innovation abstract
- `GET /api/submissions/status/:id` - Check submission status
- `POST /api/contact` - Send contact message

### Admin (JWT Required)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/research` - List research submissions
- `GET /api/admin/innovation` - List innovation submissions
- `PATCH /api/admin/submission/:type/:id` - Update status
- `GET/POST/DELETE /api/admin/announcements` - Manage announcements
- `GET/PATCH /api/admin/settings` - Manage settings
- `GET /api/admin/export/:type` - Export submissions

## 📝 License

MIT © AlMaarefa University
