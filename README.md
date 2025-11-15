# HPMS – Hotel Property Management System

A full‑stack Hotel Property Management System with a public booking website, staff front office, housekeeping operations, and admin management, built as a monorepo with a Node/Express + Prisma backend and a React + Vite + Tailwind frontend.


## Tech Stack
- **Backend**: Node.js, Express (`backend/src/`), Prisma ORM (MySQL), Socket.IO
- **Frontend**: React 19, Vite, Tailwind, React Router, Redux Toolkit
- **Database**: MySQL (via Prisma)


## Repository Structure
```
HPMS/
  backend/
    src/
      controllers/
      routes/
      services/
      middleware/
      validation/
      app.js
      server.js
    prisma/
      schema.prisma
      migrations/
    uploads/
      images/
      videos/
    package.json
  frontend/
    src/
      components/
      pages/
      services/
      redux/
      utils/
      App.jsx
      main.jsx
    public/
    package.json
  projectoutline.md
  README.md (this file)
```


## Core Data Models (from `backend/prisma/schema.prisma`)
- **Room**: `name`, `roomType`, `roomNumber`, `price`, `size`, `maxAdults`, `maxChildren`, `allowChildren`, `status`, relations to `Amenity`, `Image`, `Video`, `Booking`, `Review`.
- **Media**: `Image`, `Video` for rooms; `FacilityImage`, `FacilityVideo` for facilities.
- **Facility**: `name`, `slug`, `description`, `status`, `openingHours`, `category`.
- **Guest**: `firstName`, `lastName`, `email`, `phone`, profile metadata.
- **Booking**: `guestId`, `roomId`, `checkIn`, `checkOut`, `adults`, `children`, `totalAmount`, `status`, `source` with `Payment[]`.
- **Workflows/Logs**: `BookingWorkflowLog`, `OtaSyncLog`, `ExternalBooking`.
- **Housekeeping**: `HkTask`, `CleaningLog`, `InventoryItem`, `InventoryTxn`, `GuestRequest`, `LostFound`, `MaintenanceTicket`, `Inspection`.


## Major Modules & Features

- **Public Website (Guest‑facing)**
  - Home with hero banner, features, room previews, testimonials.
  - Rooms & Facilities with filters, grid/list, pagination, accessibility.
  - Room Details with image gallery, video tour, amenities, availability, sticky booking card.
  - Booking Form with adults + children, price/policy, payment options (eSewa/Khalti/Card), confirmation.
  - Offers and Contact pages.

- **Front Office (Staff‑facing)**
  - Dashboard KPIs: arrivals, departures, pending check‑ins.
  - Reservation management: add/modify/cancel, assign room, view media.
  - Offline new reservation with auto guest profile linking.
  - Check‑in / Check‑out workflows and billing/folio.
  - Staff authentication with forced password change on first login.

- **Housekeeping**
  - Room status map (VC/VD/OC/OD/OOO), KPIs.
  - Cleaning tasks, inventory management, special requests, lost & found.
  - Maintenance & safety, inspections, notifications.
  - Staff authentication with forced password change on first login.
  - Real-time dashboard with room status updates and notifications.

- **Admin**
  - KPIs: revenue, occupancy, productivity.
  - Room & facility CRUD with multi‑image/video management.
  - Unified Staff Management: Add both Front Office and Housekeeping staff from single interface.
  - User management, OTA integration (push/pull bookings & content), finance & reports.
  - Staff creation with temporary passwords and role assignment.

- **Shared**
  - Unified media system (images/videos) and player/lightbox.
  - Payments module (eSewa, Khalti, Card).
  - OTA sync (import bookings, push content), notifications (WebSockets/SSE).
  - Analytics hooks: `view_room`, `play_video`, `start_booking`, `complete_booking`.
  - Staff Authentication System: Secure login with role-based access and mandatory password changes.


## End‑to‑End System Flow
- Guest browses public site → views rooms/media → fills booking (adults + children) → pays → system creates/updates a **Guest Profile**.
- Booking is stored → Front Office and Admin dashboards sync → Housekeeping notified to prepare room.
- Returning guests recognized by email/phone; booking forms auto‑fill; history available.
- OTA bookings are imported and reconciled; media in Admin controls what appears on all modules.
- Admin creates staff accounts (Front Office or Housekeeping) with temporary passwords.
- Staff login with temporary credentials → forced to change password on first login → redirected to respective dashboards.
- Housekeeping staff logout automatically refreshes page and redirects to login screen.


## API Surface (high‑level)
Guest‑facing:
- `GET /api/rooms/featured`
- `GET /api/rooms` (filtering: `page,limit,type,minPrice,maxPrice,beds,mealPlan,adults,children,amenities,sort`)
- `GET /api/rooms/:id`
- `GET /api/rooms/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD`
- `GET /api/rooms/similar/:id`
- `GET /api/facilities`
- `GET /api/testimonials`
- `GET /api/offers`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/payments` and `GET /api/payments/gateways`
- `POST /api/guests` and `GET /api/guests/:id/bookings`
- `POST /api/contact`

Staff Authentication:
- `POST /api/auth/staff/login` - Front Office staff login
- `POST /api/auth/housekeeping/login` - Housekeeping staff login
- `PUT /api/auth/staff/change-password` - Front Office password change
- `PUT /api/auth/housekeeping/change-password` - Housekeeping password change

Front Office/Admin/Shared:
- `GET/POST/PUT/DELETE /api/reservations`
- `GET /api/guests`, `GET /api/guests/:id`
- `POST /api/ota/sync`, `GET /api/ota/bookings`
- `GET/POST/PUT/DELETE /api/staff` - Unified staff management (Front Office & Housekeeping)
- Housekeeping endpoints for tasks, logs, inventory, requests, maintenance, inspections (see models).

Note: Actual implemented routes live under `backend/src/routes/` and handlers in `backend/src/controllers/`.


## Local Development

### Prerequisites
- Node.js 18+
- MySQL 8+
- PNPM/NPM/Yarn (examples use NPM)

### Environment Variables (Backend)
Create `backend/.env`:
```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DB_NAME"
PORT=5000
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```
Adjust other environment variables as needed by your `backend/src/config/`.

### Install Dependencies
```
# Backend
npm install --prefix backend

# Frontend
npm install --prefix frontend
```

### Database Setup
```
# Generate Prisma client
npx prisma generate --schema backend/prisma/schema.prisma

# Apply migrations (ensure DATABASE_URL is set)
npx prisma migrate deploy --schema backend/prisma/schema.prisma
# or for local dev initialize from migrations
npx prisma migrate dev --schema backend/prisma/schema.prisma
```

### Run the Apps
```
# Backend (port from .env, default 5000)
npm run dev --prefix backend

# Frontend (Vite default 5173)
npm run dev --prefix frontend
```

The frontend expects the backend API at `http://localhost:5000` (configure in `frontend/src/services/` if needed).


## Production
```
# Backend
npm run start --prefix backend

# Frontend build
npm run build --prefix frontend
# serve the dist/ with your preferred static server or proxy via Nginx
```


## Media Uploads
- Upload roots are under `backend/uploads/images/` and `backend/uploads/videos/`.
- Media URLs are stored in models (`Image.url`, `Video.url`, `FacilityImage.url`, `FacilityVideo.url`).


## Coding Conventions
- Shared design tokens and consistent components across public and internal UIs.
- Accessibility: alt text, ordered media, captions; keyboard navigation for filters, pagination, galleries.
- Server‑side filtering for rooms; debounced UI requests on filter changes.
- Staff Authentication: All staff (Front Office & Housekeeping) must change temporary passwords on first login.
- Unified Staff Management: Admin can create both staff types from single interface with role selection.
- Logout Behavior: Housekeeping staff logout triggers automatic page refresh and redirect to login.


## Scripts Reference
Backend (`backend/package.json`):
- `dev`: `nodemon src/server.js`
- `start`: `node src/server.js`

Frontend (`frontend/package.json`):
- `dev`: `vite`
- `build`: `vite build`
- `preview`: `vite preview`
- `lint`: `eslint .`


## Troubleshooting
- Verify `DATABASE_URL` and MySQL connectivity before running migrations.
- Confirm CORS origin matches frontend dev server.
- If media doesn’t display, check that uploads folders exist and the process has write permissions.
- Socket.IO features require both backend (`backend/src/socket.js`) and frontend client to be running.


## License
ISC (see `package.json`).
