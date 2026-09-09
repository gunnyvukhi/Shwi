<div align="center">

# ⚡ Shwi - Health & Fitness Tracking Platform

**Modern, intelligent fitness, workout, and health analytics platform built for athletes and fitness enthusiasts.**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20Ti%E1%BA%BFng%20Vi%E1%BB%87t-blue?style=flat-square)](#-internationalization-i18n)

[Features](#-key-features) • [Architecture](#-architecture--tech-stack) • [Quickstart with Docker](#-quickstart-docker-compose) • [Manual Setup](#-manual-development-setup) • [API Reference](#-api-overview) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Shwi** is an all-in-one personal health and fitness tracking web application. It empowers users to monitor their daily physical activity, track macronutrient intake, analyze sleep patterns, inspect heart rate metrics, and record detailed workout sessions targeting specific muscle groups. 

Built with a modern microservices-ready containerized architecture, **Shwi** pairs a high-performance **React 19 + Vite** frontend with a robust **Flask 3 + SQLAlchemy + MySQL** RESTful backend.

---

## ✨ Key Features

### 📊 Comprehensive Health & Fitness Analytics
- **Calorie & Activity Monitoring**: Daily, weekly, and monthly active calorie expenditure tracking visualized via interactive Recharts.
- **Heart Rate Analysis**: Continuous Resting Heart Rate (RHR), peak metrics, and status classifications (Peak, Cardio, Normal, Resting).
- **Sleep Architecture Tracker**: Duration, efficiency scoring, and detailed stage breakdowns (Deep, REM, and Light sleep).
- **Step & Distance Tracking**: Step counting with target progression, distance calculations, and calories burned.
- **Interactive Body Muscle Visualizer**: Interactive anatomical muscle group visualizer displaying targeted muscle zones.

### 🏋️ Workout & Nutrition Logging
- **Workout Sessions**: Log workouts by split (Push/Pull/Legs), intensity, duration, muscle groups, and custom workout notes.
- **Macronutrient Tracking**: Detailed food intake logs detailing meal type (Breakfast, Lunch, Dinner, Snacks), calories, and protein/carbs/fat macros.
- **Weight Progress Curves**: Historical weight tracking with goal trendlines.

### 🔐 Security & Multi-Provider Authentication
- **Email & Password Authentication**: Secure registration and login backed by bcrypt/scrypt password hashing.
- **6-Digit OTP Email Verification**: Automated OTP generation and SMTP email dispatch for email verification and secure password resets.
- **OAuth 2.0 Single Sign-On**: One-click authentication with **Google Sign-In** (`@react-oauth/google`) and **Apple Sign-In**.
- **Stateless JWT Authorization**: Secure access tokens with role validation and token expiry guards.

### 🎨 Premium User Experience & Customization
- **Profile & Social Banner**: Upload custom avatars and wallpaper banners directly to **Cloudinary** cloud storage.
- **Dynamic Theming**: Seamless dark and light modes with instant persistence in local storage.
- **Multi-language (i18n)**: Instant switching between **English (`en`)** and **Vietnamese (`vi`)** across the entire interface.
- **Responsive Layout**: Designed for seamless usage across desktop, tablet, and mobile screens.

---

## 🏗 Architecture & Tech Stack

```
                     ┌────────────────────────┐
                     │   Client (Browser)     │
                     └───────────┬────────────┘
                                 │ HTTP / REST
                     ┌───────────▼────────────┐
                     │   Nginx Reverse Proxy  │ (Port 80)
                     │     & React 19 UI      │
                     └───────────┬────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │    Flask REST API      │ (Port 5000)
                     └─────┬────────────┬─────┘
                           │            │
             ┌─────────────▼──┐      ┌──▼───────────────┐
             │   MySQL 8.0    │      │ Cloudinary Media │
             │  (Port 3306)   │      │   & SMTP Email   │
             └────────────────┘      └──────────────────┘
```

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) | Next-generation declarative component-driven UI |
| **Build & Bundler** | [Vite 8](https://vitejs.dev/) | Ultra-fast Hot Module Replacement (HMR) and production bundling |
| **State & Routing** | [Zustand](https://github.com/pmndrs/zustand), [React Router 7](https://reactrouter.com/) | Lightweight reactive state store & declarative routing |
| **Charts & Icons** | [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/) | Smooth responsive vector charts and clean icons |
| **Backend API** | [Python 3.11+](https://www.python.org/), [Flask 3.x](https://flask.palletsprojects.com/) | RESTful backend microservice |
| **ORM & DB Access**| [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/), [PyMySQL](https://pymysql.readthedocs.io/) | Declarative schema models and database connectivity |
| **Database** | [MySQL 8.0](https://www.mysql.com/) | Relational persistent store with `utf8mb4` character set |
| **Auth & Security** | [PyJWT](https://pyjwt.readthedocs.io/), [Google Auth](https://google-auth.readthedocs.io/), Werkzeug | JWT authorization and OAuth identity verification |
| **Cloud Storage** | [Cloudinary](https://cloudinary.com/) | Media asset hosting and image transformation |
| **Containerization**| [Docker](https://www.docker.com/), Docker Compose | Full-stack reproducible multi-container orchestration |

---

## 📁 Repository Structure

```plaintext
Shwi/
├── api/                           # Backend Flask Service
│   ├── routes/                    # API route blueprints
│   │   ├── auth.py                # Authentication & OAuth endpoints
│   │   └── user.py                # Health metrics, profile & dashboard endpoints
│   ├── app.py                     # Application factory & DB migration runner
│   ├── config.py                  # Flask configuration & environment loader
│   ├── email_service.py           # SMTP mailer & 6-digit OTP engine
│   ├── models.py                  # SQLAlchemy ORM models (User, Health Logs, etc.)
│   ├── utils.py                   # JWT handlers & auth decorators
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Backend container definition
│   └── .env.example               # Backend environment variable template
│
├── ui/                            # Frontend React Service
│   ├── src/
│   │   ├── components/            # Shared UI components & layout modules
│   │   ├── context/               # React Context providers (LanguageContext)
│   │   ├── i18n/                  # Localization files (English / Vietnamese)
│   │   ├── pages/                 # Route views (Home, Dashboard, Profile, Auth)
│   │   ├── routes/                # Client routing configuration
│   │   ├── services/              # API clients & Axios/Fetch wrappers
│   │   ├── store/                 # Zustand global authentication state
│   │   ├── App.tsx                # Root component
│   │   └── main.tsx               # Application entry point
│   ├── nginx.conf                 # Production Nginx reverse proxy configuration
│   ├── Dockerfile                 # Frontend multi-stage container build
│   ├── package.json               # Node.js dependencies and build scripts
│   ├── vite.config.ts             # Vite configuration
│   └── .env.example               # Frontend environment variable template
│
├── docker-compose.yml             # Orchestration for DB, API, and UI containers
├── DB_PASSWORD.txt.example        # Secret template for MySQL root password
├── TODO.txt                       # Development roadmap notes
└── README.md                      # Project documentation
```

---

## 🚀 Quickstart: Docker Compose (Recommended)

The quickest and cleanest way to launch the entire stack (Database, API, and UI) is via Docker Compose.

### 1. Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS, Windows, or Linux)
- Ensure Docker daemon is running.

### 2. Clone the Repository
```bash
git clone https://github.com/gunnyvukhi/Shwi.git
cd Shwi
```

### 3. Initialize Secret & Environment Files

1. **MySQL Root Password Secret**:
   ```bash
   cp DB_PASSWORD.txt.example DB_PASSWORD.txt
   # Set your desired strong root password inside DB_PASSWORD.txt
   ```

2. **Backend Configuration (`api/.env`)**:
   ```bash
   cp api/.env.example api/.env
   ```
   *Edit `api/.env` to configure your `SECRET_KEY`, database credentials matching `DB_PASSWORD.txt`, and optional SMTP/Google credentials.*

3. **Frontend Configuration (`ui/.env`)**:
   ```bash
   cp ui/.env.example ui/.env
   ```

### 4. Build and Run the Stack
```bash
docker compose up --build -d
```

### 5. Access the Services
- 🌐 **Web Application**: [http://localhost](http://localhost)
- 🔌 **REST API Base**: [http://localhost:5000/api](http://localhost:5000/api)
- 🗄️ **MySQL Database**: `localhost:3306` (Database: `shwi_db`)

To view live container logs:
```bash
docker compose logs -f
```

To gracefully shut down the stack:
```bash
docker compose down
```

---

## 🛠️ Manual Development Setup

If you prefer running services locally without containers during active development:

### 1. Database Setup (MySQL)
Ensure a MySQL 8.0 instance is running locally:
```sql
CREATE DATABASE IF NOT EXISTS shwi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup (Flask API)
1. Navigate to the `api` folder and create a virtual environment:
   ```bash
   cd api
   python -m venv .venv
   ```
2. Activate virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `MYSQL_HOST=localhost`, `MYSQL_USER=root`, `MYSQL_PASSWORD=<your_password>`, and `MYSQL_DB=shwi_db` are properly set.
5. Start the Flask server:
   ```bash
   python app.py
   ```
   *API will run on [http://localhost:5000](http://localhost:5000)*.

### 3. Frontend Setup (React UI)
1. Open a new terminal and navigate to the `ui` folder:
   ```bash
   cd ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL=http://localhost:5000/api`.
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The UI will be accessible at [http://localhost:5173](http://localhost:5173)*.

---

## ⚙️ Environment Variables Reference

### Backend (`api/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `SECRET_KEY` | **Yes** | - | Secret key used for signing JWT tokens and session data |
| `MYSQL_HOST` | **Yes** | `localhost` | Hostname of the MySQL database (`db` when in Docker) |
| `MYSQL_PORT` | No | `3306` | Port of MySQL server |
| `MYSQL_USER` | **Yes** | `root` | Database username |
| `MYSQL_PASSWORD` | **Yes** | - | Database user password |
| `MYSQL_DB` | **Yes** | `shwi_db` | Target database name |
| `CORS_ALLOWED_ORIGINS` | No | `*` | Comma-separated list of allowed origins |
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP host for sending 6-digit OTP emails |
| `EMAIL_PORT` | No | `587` | SMTP port (typically 587 for TLS) |
| `EMAIL_HOST_USER` | No | - | SMTP email username |
| `EMAIL_HOST_PASSWORD` | No | - | SMTP email app password |
| `GOOGLE_CLIENT_ID` | No | - | Google Cloud OAuth Client ID for token verification |
| `APPLE_CLIENT_ID` | No | - | Apple Services ID for Sign in with Apple |
| `CLOUDINARY_CLOUD_NAME`| No | - | Cloudinary cloud identifier for media uploads |
| `CLOUDINARY_API_KEY` | No | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET`| No | - | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | No | - | Cloudinary unsigned upload preset name |

### Frontend (`ui/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:5000/api` | Base URL of the backend REST API |
| `VITE_GOOGLE_CLIENT_ID` | No | - | Google Cloud OAuth 2.0 Web Client ID |
| `VITE_APPLE_CLIENT_ID` | No | - | Apple OAuth Client identifier |

---

## 📡 API Overview

All API endpoints are prefixed with `/api`. Protected routes require a Bearer token: `Authorization: Bearer <token>`.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new account & trigger email OTP | No |
| `POST` | `/api/auth/verify-email-otp` | Verify 6-digit OTP to activate account | No |
| `POST` | `/api/auth/resend-otp` | Resend verification or password reset OTP | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `POST` | `/api/auth/google` | Sign in or register via Google OAuth credential | No |
| `POST` | `/api/auth/apple` | Sign in or register via Apple Identity token | No |
| `POST` | `/api/auth/forgot-password` | Request password reset code via email | No |
| `POST` | `/api/auth/reset-password-otp` | Verify reset OTP and update password | No |
| `GET` | `/api/auth/me` | Fetch authenticated user info from token | **Yes** |

### User & Health Services (`/api/user`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/user/profile` | Retrieve user profile & fitness parameters | **Yes** |
| `PUT` | `/api/user/profile` | Update profile attributes, goals & bio | **Yes** |
| `POST` | `/api/user/upload-media` | Upload avatar or wallpaper to Cloudinary | **Yes** |
| `GET` / `POST` | `/api/user/heart-rate` | Fetch or submit heart rate telemetry logs | **Yes** |
| `GET` / `POST` | `/api/user/sleep` | Fetch or submit sleep cycle duration & quality | **Yes** |
| `GET` / `POST` | `/api/user/steps` | Fetch or submit step counts & distance | **Yes** |
| `GET` / `POST` | `/api/user/workout` | Fetch or submit workout sessions & muscle groups | **Yes** |
| `GET` / `POST` | `/api/user/food-intake` | Fetch or submit meals and macronutrient data | **Yes** |
| `GET` | `/api/user/dashboard` | Fetch consolidated telemetry data for charts | Optional |

---

## 🌐 Internationalization (i18n)

Shwi features seamless native internationalization supporting:
- 🇺🇸 **English (`en`)**
- 🇻🇳 **Vietnamese (`vi`)**

The active language preference is preserved in the client context and automatically applied across all forms, alerts, navigation bars, and health metric summaries.

---

## 🧪 Testing & Quality Assurance

### Run Frontend Linter & Type Check
```bash
cd ui
npm run lint
npm run build
```

### Run Backend Integration Tests
Ensure your backend test server is running:
```bash
cd api
python test_auth_flow.py
python test_crud_logs.py
```

---

## 🤝 Contributing

Contributions make the open-source community an inspiring place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/gunnyvukhi">gunnyvukhi</a> and contributors.</sub>
</div>
