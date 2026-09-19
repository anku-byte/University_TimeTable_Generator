# CampusGrid | Academic Timetable Management

**CampusGrid** is a generic, formal academic administration platform for managing higher education timetables. It enables institutional administrators to manage departments, faculty, classrooms, catalog subjects, and section assignments, and automatically generate 100% clash-free timetables backed by PostgreSQL and Prisma.

---

## 🌟 Key Features

- **Generic Academic Administration**: Multi-department support (Computer Science, Electronics, Electrical, Mechanical, Civil, Business Administration, etc.) with dynamic database configuration.
- **Formal Institutional Interface**: Restrained, accessible, professional UI designed for university coordinators, HODs, and academic officers.
- **Role-Based Authorization**:
  - **ADMIN**: Full management of departments, resources, section assignments, schedule generation, manual slot overrides, and schedule publishing.
  - **VIEWER**: Searchable, read-only access to published timetables filtered by department, section, faculty member, or room.
- **Secure Authentication**: Hashed password storage (`bcryptjs`), secure HTTP-only session cookies, and server-side route protection (`middleware.ts`).
- **CSP/Backtracking Solver Engine**: Internal Constraint Satisfaction Problem (CSP) solver enforcing hard collision safeguards (no double-booked faculty, rooms, or sections).
- **Draft & Publish Workflow**: Generated schedules remain in `DRAFT` status until explicitly reviewed and published by an administrator.
- **Export Capabilities**: One-click export of timetable grids to formatted **PDF** documents and **Excel** spreadsheets.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL & Prisma 5.22
- **Authentication**: `bcryptjs` + JWT session cookies
- **Styling**: Tailwind CSS & Lucide Icons
- **PDF & Excel Exports**: `jsPDF`, `jspdf-autotable`, `xlsx`

---

## 📁 Project Structure

```
d:/time_table/
├── prisma/
│   ├── schema.prisma      # PostgreSQL models (User, Department, Faculty, Room, Subject, Section, Timetable)
│   └── seed.ts            # Seed script for initial Admin user & academic data
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Admin and Viewer portal layouts
│   │   │   ├── admin/     # Admin dashboard, resource management, timetable generator
│   │   │   ├── viewer/    # Viewer published schedule portal
│   │   │   └── timetable/ # Interactive timetable grid
│   │   ├── api/           # API routes (Auth, Resources, Generate, Publish, Exports)
│   │   └── login/         # Institutional login page
│   ├── components/        # UI components (Layout, Resources, Timetable Grid, Diagnostics)
│   ├── lib/
│   │   ├── auth.ts        # Password hashing & session token management
│   │   ├── db.ts          # Global Prisma client instance
│   │   └── solver/        # Internal CSP/Backtracking engine
│   └── middleware.ts      # Server-side role protection middleware
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/timetable_db?schema=public"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Initial Admin Credentials (used by seed)
ADMIN_NAME="Administrator"
ADMIN_EMAIL="admin@campusgrid.edu"
ADMIN_PASSWORD="adminpassword123"

# Session JWT Secret
JWT_SECRET="campusgrid-secret-key-30219"
```

---

## 🚀 Setup & Execution Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Validate Prisma Schema
```bash
npx prisma validate
```

### 4. Push Database Schema to PostgreSQL
```bash
npx prisma db push
```

### 5. Seed Initial Administrator & Academic Data
```bash
npx prisma db seed
```

### 6. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Credentials & Testing

### Administrator Account
- **Email**: `admin@campusgrid.edu` (or configured `ADMIN_EMAIL`)
- **Password**: `adminpassword123` (or configured `ADMIN_PASSWORD`)
- **Access**: Full administrative privileges (`/admin`)

### Viewer Account
- **Email**: `viewer@campusgrid.edu`
- **Password**: `viewerpassword123`
- **Access**: Read-only view of published schedules (`/viewer`)

---

## 📡 API Routes Summary

### Authentication
- `POST /api/auth/login` — Validate credentials & set HTTP-only session cookie
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Return current session user details

### Academic Resources
- `GET | POST | DELETE /api/resources/department` — Manage departments
- `GET | POST | DELETE /api/resources/faculty` — Manage teaching faculty
- `GET | POST | DELETE /api/resources/room` — Manage classrooms & labs
- `GET | POST | DELETE /api/resources/subject` — Manage catalog courses
- `GET | POST | DELETE /api/resources/section` — Manage student sections
- `GET | POST | DELETE /api/resources/assignment` — Manage section-subject-faculty bindings

### Scheduling & Exports
- `POST /api/generate` — Trigger timetable generator (ADMIN only)
- `POST /api/timetables/[id]/publish` — Publish draft timetable (ADMIN only)
- `GET /api/export/pdf` — Export timetable grid as PDF
- `GET /api/export/excel` — Export timetable grid as Excel sheet

---

## 📄 License
Academic & Institutional License.

