# RoadGuard AI – Smart Road Damage Detection & Reporting System

RoadGuard AI is a professional, full-stack, AI-powered web application for municipal road maintenance. It uses a **YOLOv8** computer vision model and **OpenCV** to automatically detect road anomalies (potholes, structural cracks) in uploaded images/videos, categorize severity, log geo-tagged reports, map them dynamically on an interactive dashboard, and track repair cycles.

---

## 🏗️ Architecture

```
                               +-----------------------------+
                               |     React + Tailwind UI     |
                               +--------------+--------------+
                                              | (HTTP / Socket.IO)
                                              v
                               +--------------+--------------+
                               |   Node.js + Express API    |
                               +-------+--------------+------+
                                       |              |
                    (Inference Requests)|              | (Mongoose DB Operations)
                                       v              v
      +--------------------------------+--+      +----+------------------+
      | Python Flask + YOLOv8 Service     |      |    MongoDB Database   |
      +-----------------------------------+      +-----------------------+
```

---

## ⚡ Main Features

1. **User Authentication & Authorization**: Roles for standard citizens (`user`) and municipality officials (`admin`) backed by JWT auth.
2. **AI Road Damage Detection**: Integrates YOLOv8 and OpenCV to mark bounding boxes around potholes and cracks, assessing severity (low, medium, or high).
3. **Complaint Reporting System**: Citizen-led complaint pipeline, including picture attachments, automatic location identification (GPS/photo EXIF extraction), and detailed logs.
4. **Interactive Map Dashboard**: Interactive Leaflet maps displaying nearby warnings and aggregated density heatmaps.
5. **Admin Analytics Dashboard**: Statistical review of reports, repair schedules, and monthly analytics using Chart.js.
6. **Real-time Notifications**: Immediate updates pushed via Socket.IO alerts and background email dispatches.

---

## 📂 Folder Structure

```
road/
├── frontend/                  # React.js + Tailwind CSS Client (Vite)
│   ├── src/
│   │   ├── api/               # Axios configuration
│   │   ├── components/        # Subdivided into Layouts, UI, Charts, and Maps
│   │   ├── context/           # React Context (Auth + WebSockets)
│   │   ├── hooks/             # Custom Hooks
│   │   ├── pages/             # App Pages (Dashboard, Detect, Map, Admin, etc.)
│   │   └── utils/             # Helper utilities and constant configurations
├── backend/                   # Node.js + Express MVC server
│   ├── config/                # Mongoose + Cloudinary settings
│   ├── controllers/           # MVC Controllers (auth, report, admin, detection)
│   ├── middleware/            # JWT, Roles, Upload, and Error handling
│   ├── models/                # MongoDB Schema models (User, Report, Detection)
│   ├── routes/                # REST endpoints mapping
│   ├── seeds/                 # Sample seeder file
│   └── utils/                 # Sockets + Mail utilities
├── ai-service/                # Python Flask + YOLOv8 AI Service
│   ├── services/              # YOLO detector & OpenCV preprocessing routines
│   └── utils/                 # Severity grading criteria
├── docker-compose.yml         # Container orchestration configuration
└── README.md                  # Main manual guide
```

---

## 🚀 Running the Project

### Method 1: Using Docker (Recommended)

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running.
2. Navigate to the root directory and run:
   ```bash
   docker-compose up --build
   ```
3. Once running, access the services:
   - **Frontend UI**: `http://localhost`
   - **Backend API**: `http://localhost:5000`
   - **AI Flask Service**: `http://localhost:5001`

---

### Method 2: Local Installation

#### Prerequisite: Run MongoDB
Ensure MongoDB is running locally on port `27017` or update the URI in your `.env`.

#### 1. Setup Backend
1. Go to `/backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the environment variables:
   Configure `backend/.env` based on `backend/.env.example`
4. Seed the database with sample locations:
   ```bash
   npm run seed
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

#### 2. Setup AI Service
1. Go to `/ai-service`
2. Create and start a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```bash
   python app.py
   ```
   *Note: On first execution, the YOLOv8 weight file (`yolov8n.pt`) will automatically download.*

#### 3. Setup Frontend
1. Go to `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run dev
   ```
4. Open your browser to: `http://localhost:5173`

---

## 👤 Test Credentials

You can test the system using the pre-seeded accounts:

### Citizen Reporter (User)
- **Email**: `user@roadguard.ai`
- **Password**: `user123`

### Municipal Officer (Admin)
- **Email**: `admin@roadguard.ai`
- **Password**: `admin123`

---

## 📡 Key API Documentation

### Auth Endpoints
- `POST /api/auth/register` - Sign up new reporter
- `POST /api/auth/login` - Authenticate credentials, returns JWT
- `GET /api/auth/me` - Profile checks

### Report Endpoints
- `POST /api/reports` - Submit a new road report (Supports Multi-image uploads + location JSON)
- `GET /api/reports` - List reports submitted by the active user
- `GET /api/reports/nearby` - Get reports around a specific coordinate
- `GET /api/reports/map` - Fetch all approved reports (Public map view)

### Detection Endpoints
- `POST /api/detect` - Upload a single photo to run AI detection, returns boundaries and severity

### Admin Endpoints
- `GET /api/admin/reports` - List all reports with admin review filters
- `PUT /api/admin/reports/:id/status` - Transition statuses & write municipal notes
- `GET /api/admin/analytics` - Pull aggregations for Chart.js
