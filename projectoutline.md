1. Public Website (Guest-Facing)
1.1 Home Page
UI Wireframe

Hero Banner: Full-width image/video background, tagline, CTA “Book Now” (same hero style applied on Rooms page).

Navbar: Home | Rooms | Offers | About | Contact | Login/Register (sticky with blur on scroll).

Features Section: Icons (Wi-Fi, Pool, Spa, Restaurant, Parking).

Rooms Preview: Grid (Standard, Deluxe, Suite) → Photo + Video Preview + Price + CTA “View Details”.

Facility Highlights: Cards/icons for Gym, Spa, Pool, Conference Room (same card style used on Rooms page).

Testimonials: Guest review carousel with text + video reviews.

Footer: Contact info, address, map, social icons.

Frontend Components

<Navbar /> <HeroBanner /> <FeaturesSection /> <RoomPreview /> <FacilityHighlights /> <TestimonialsCarousel /> <Footer />

Backend APIs

GET /api/rooms/featured → Featured rooms + videos

GET /api/facilities → Facility list

GET /api/testimonials → Guest text + video reviews

1.2 Rooms & Facilities Page (Styled to match Home)
UI Wireframe

Page hero + breadcrumb matching Home.

Filters panel (desktop left; mobile top drawer): Room type, price slider, bed type, meal plan, adults/children steppers, amenities chips, sort.

Room Grid: Cards styled identically to Home preview; 3/2/1 responsive columns; hover quick-gallery on desktop.

Facilities Showcase: Cards + optional muted video previews on hover (same card system).

View modes: grid/list toggle, pagination or infinite scroll.

Accessibility: aria labels, keyboard navigation for filters & pagination.

Frontend Components

<RoomsFilters /> <RoomsList> (RoomCard variant) <FacilityCard /> <GridToggle /> <Pagination /> <FilterDrawer/> (mobile)

APIs

GET /api/rooms → List all rooms with video links, supports query params:
?page=&limit=&type=&minPrice=&maxPrice=&beds=&mealPlan=&adults=&children=&amenities=&sort=

GET /api/facilities → Facility details with videos

Notes: server-side filtering, debounced requests on filter changes, consistent token usage for spacing/colors.

1.3 Individual Room Detail Page
UI Wireframe

Room Image Gallery: Multiple high-quality images with thumbnail navigation; lightbox, keyboard nav, swipe on mobile.

Embedded Room Video Tour: play-in-lightbox or inline player with poster image.

Room Details: Description, amenities (icon list), size, bed type, capacity.

Price Breakdown: base rate, taxes, refundable policy, nightly breakdown if multi-night.

Availability Calendar: interactive datepicker (blocked dates disabled).

Similar Rooms Section: horizontal carousel (styled same as RoomCard).

CTA: Floating sticky booking card on desktop: selected dates, guests (adults + children), price, Book button.

Frontend Components

<RoomGallery /> <RoomDetails /> <AvailabilityCalendar /> <BookingStickyCard /> <SimilarRooms />

APIs

GET /api/rooms/:id → Individual room details with multiple images + videos

GET /api/rooms/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD → Room availability

GET /api/rooms/similar/:id → Similar room suggestions

1.4 Booking Form (Updated with Children Field & Auto Profile Creation)
UI Wireframe

Guest Info: Name (first/last), Email, Phone (country code).

Stay Details: Check-in Date, Check-out Date, Adults (stepper), Children (stepper), Room preference (with room image), Special requests (textarea).

Price & Policy: Show price estimate, taxes, cancellation policy.

Payment Options: eSewa, Khalti, Card (show icons and brief instructions).

Confirmation: Booking receipt + room video link + room images + booking ID (email & page).

Auto-sync with Front Office.

🆕 New Feature: Guest Profile Creation

When a booking is completed, the system automatically creates or updates a Guest Profile.

The profile stores guest information, past bookings, preferences, and stay history.

On future visits, returning guests can log in or be recognized by email/phone to auto-fill booking forms and view previous stay history.

Frontend Components

<BookingForm /> <GuestInputs /> <GuestSummary /> <PaymentOptions /> <BookingConfirmation />

APIs

POST /api/bookings → Create booking
Payload: { name, email, phone, checkIn, checkOut, adults, children, roomId, requests }

POST /api/guests → Create or update guest profile upon successful booking

GET /api/guests/:id/bookings → Retrieve guest booking history

GET /api/payments/gateways → Payment options

POST /api/payments → Process payment (eSewa/Khalti/Card)

GET /api/bookings/:id → Booking receipt

Validation & UX:
Inline validation, country phone masks, accessible errors, save-in-progress (localStorage) support.

1.5 Special Offers
UI Wireframe

Offer cards (same card system) with discount, validity, room video preview, CTA “View Details”.

API

GET /api/offers

1.6 Contact Page
UI Wireframe

Interactive map (embed + marker), contact form, hotel info (address, phone, email), hours.

API

POST /api/contact

2. Front Office Dashboard (Staff-Facing)
2.1 Dashboard Overview

KPIs: Arrivals, Departures, Pending check-ins

Quick Actions: New Reservation, Check-in, Check-out

2.2 Reservation Management

Table: Reservation No, Guest, Room(s), Adults, Children, Status
Actions: Add, Modify, Cancel, Assign Room, View Room Gallery & Video

APIs

GET /api/reservations

GET /api/reservations/:id

POST /api/reservations

PUT /api/reservations/:id

DELETE /api/reservations/:id

2.3 New Reservation (Offline)

Guest info, Stay details (adults + children), Payment options, Rate & Package, room gallery & videos linked

🆕 Auto Profile Linking:
When staff create an offline reservation, if the guest already exists (matched by phone/email), the booking links to their existing profile. Otherwise, a new guest profile is auto-created.

2.4 Room Status

Real-time statuses: VC (Vacant Clean), VD (Vacant Dirty), OC (Occupied Clean), OD (Occupied Dirty), OOO
Assign rooms, view gallery & videos

2.5 Guest Profiles

Automatically generated during first booking (online/offline).

Shows past stays, preferences, loyalty level, VIP notes.

Editable by staff (contact info, preferences).

Linked to all reservations for that guest.

APIs

GET /api/guests → List guest profiles

GET /api/guests/:id → View guest profile details

GET /api/guests/:id/bookings → View booking history

2.6 Check-in / Check-out

Auto-update room status, print/check documents, show room gallery & video preview of assigned room

2.7 Billing & Payments

Guest folio (room, F&B, extras), split payments, refunds
Payment methods: Cash, Card, eSewa, Khalti

2.8 Reports

Daily arrivals/departures, occupancy, revenue, payment reconciliation

3. Housekeeping Dashboard
1. Overview

Staff-facing dashboard for managing room cleaning, housekeeping schedules, and staff assignments.

Real-time updates for room statuses and notifications.

Integration with Front Office for check-ins/check-outs, room availability, and cleaning assignments.

Notifications system for housekeeping tasks and maintenance requests.

Filters for viewing rooms by status (Clean, Needs Cleaning, Occupied, Maintenance).

Notes and media (photo/video) support per room.

Housekeeper profile pictures shown across the UI (top nav, staff grid, notifications).

2. UI Components & Layout
2.1 Top Navigation

Sticky navbar with blur effect on scroll.

Elements:

Dashboard title: 🏠 Housekeeping Dashboard

Current Date & Shift info

Notifications bell icon with unread badge

Staff profile (name + profile picture avatar). Clicking opens quick profile menu (view profile, settings, logout).

2.2 Sidebar Navigation

Collapsible/scrollable vertical sidebar.

Items:

Dashboard – Overview & Stats

Room Status – Room cards & filters

Schedule – Today's cleaning schedule

Staff Assignment – Staff and room allocation

Settings – Housekeeping settings

UI details:

Active tab highlight & hover effects

Small avatar next to “Staff Assignment” when collapsed (optional)

2.3 Main Content Tabs
Dashboard Overview

Stats Cards (responsive grid 1–4 columns):

Clean Rooms – count & green indicator

Needs Cleaning – count & red indicator

Occupied – count & blue indicator

Maintenance – count & orange indicator

Quick Actions

View All Rooms

Mark Multiple Clean

Report Issue

Room Status Board

Filter bar (All Rooms, Clean, Needs Cleaning, Occupied, Maintenance)

Room Cards (responsive grid 1–4 columns) — each card shows:

Room number

Status icon and color

Housekeeper name + profile picture (thumbnail) or avatar initials

Checkout time (if applicable)

Last cleaned time (if applicable)

Notes (optional snippet)

Buttons: Mark Clean, Add Note (modal), View Media, Status dropdown

Card styling color-coded by status

Schedule

List of rooms requiring cleaning today

Room number, housekeeper (with avatar), checkout time

Action buttons for marking clean

Filter for different shifts/dates (future enhancement)

Staff Assignment

Grid of housekeepers — each housekeeper card shows:

Profile picture (circular), name, role

Rooms assigned (list/badges)

Room statuses for assigned rooms (colored badges)

Quick action: Reassign room (future drag/drop), Message, View profile

Settings

Housekeeping-specific configurations (shift timings, notifications, priority rules)

Profile picture settings and upload policy

3. Modals & Popups
Add Note Modal

Textarea for room-specific notes

Save / Cancel buttons

Closes on backdrop click or X button

Profile Photo Upload Modal (new)

Shows current profile picture, option to upload/change

Drag & drop + choose file

Cropper preview (square/round), rotate option

Validation: max file size (e.g., 5MB), accepted types (jpg, png, webp)

Save / Cancel

Automatic thumbnail generation after upload

Notifications Dropdown

List of notifications (latest first) with optional sender avatar

Mark as read

Unread count indicator on bell icon

Scrollable if overflowing

4. State & Interactivity

State Variables (high level)

activeTab – currently selected sidebar tab

rooms – array of room objects: { id, number, status, floor, housekeeperId, housekeeperName, checkoutTime, notes, lastCleaned, media }

housekeepers – array of housekeeper objects: { id, name, profilePictureUrl, assignedRooms, statusCounts }

filter – current room status filter

selectedRoom – for note/media modal

showNoteModal – toggle note modal

newNote – note content

notifications – array of notifications with sender avatar where applicable

showNotifications – toggle notifications dropdown

Interactive Functions

updateRoomStatus(roomId, newStatus) – updates room status & last cleaned time, triggers notification

addNote(roomId, note) – saves room note

uploadHousekeeperPhoto(housekeeperId, file) – uploads and sets profilePictureUrl

markNotificationRead(notificationId) – marks a notification as read

Filter rooms dynamically based on filter

Sidebar navigation updates activeTab

5. Room Status Logic

Statuses & colors:

clean – green (icon: Lucide CheckCircle)

needs-cleaning – red (icon: Lucide AlertCircle)

occupied – blue (icon: Lucide User)

maintenance – orange (icon: Lucide Wrench)

Behavior:

Status update triggers a notification and visual feedback (toast + card highlight)

Guest checks out → room automatically flagged needs-cleaning (via Front Office webhook)

Housekeeper marks room clean → lastCleaned timestamp updated

6. Notifications System

Bell icon in top nav shows unread count

Dropdown contains message, timestamp, and sender avatar (if from staff)

Mark as read per item or bulk mark-all

Notifications generated for: new checkouts, assignment changes, status updates, reported issues

Supports real-time updates (WebSocket in future)

7. Filters & Search

Room status filter dropdown

Search by room number

Expandable filters: floor, housekeeper, time-based availability

Filtered rooms dynamically update the room grid

8. Housekeeping Workflow

Guest checks out → Front Office updates room status → needs-cleaning

Dashboard updates and notifies assigned housekeeper

Housekeeper receives notification (with room + quick actions)

Housekeeper marks room clean via dashboard → lastCleaned timestamp updated

Notifications for completed cleaning auto-generate

Notes can be added for special instructions or issues

Admin/Front Office reviews room statuses in real time

9. Housekeeper Profile Picture — Details & UX

Where shown

Top nav staff avatar

Housekeeper cards in Staff Assignment

Room cards (thumbnail beside name)

Notifications (sender avatar)

Housekeeper profile page/modal

Upload flow

Upload through profile edit or admin staff management

Accept JPG/PNG/WEBP; max 5MB

Provide cropper (circle/thumbnail) + preview

Store one canonical full-size image + generated thumbnails (e.g., 128×128, 48×48)

Fallback

If no picture provided, show initials avatar (e.g., RC) with color background

Option to show a default silhouette image

Privacy & storage options

Upload to your app storage, S3/Cloud, or optional IPFS/Filecoin

Use secure URLs (signed if needed)

Validate file type on backend + sanitize filenames

10. Future Enhancements

Real-time WebSocket integration for live updates and presence indicators

Drag-and-drop room assignments for staff

Floor-wise room maps with status color coding

Bulk actions for marking multiple rooms clean

Integration with Housekeeping Inventory (low stock alerts)

Export daily cleaning reports or sync with Front Office reports

Mobile-optimized UI and PWA support for housekeepers on the go

11. API Endpoints (updated with profile picture)
Rooms

GET /api/rooms
Response: list of rooms with { id, number, status, floor, housekeeperId, housekeeperName, checkoutTime, lastCleaned, notes, media }

PUT /api/rooms/:id/status
Body: { status: "clean" | "needs-cleaning" | "occupied" | "maintenance" }
Effect: updates status, sets lastCleaned if clean, emits notification

PUT /api/rooms/:id/note
Body: { note: string }
Effect: add/update room note

Notifications

GET /api/notifications

PUT /api/notifications/:id/read

Housekeepers (new / updated)

GET /api/housekeepers
Response: { id, name, role, profilePictureUrl, assignedRooms[], contact, statusCounts }

GET /api/housekeepers/:id
Response: full profile

POST /api/housekeepers
Create new housekeeper (admin only)

PUT /api/housekeepers/:id
Update profile (name, contact, role)

POST /api/housekeepers/:id/photo
Accepts multipart/form-data file upload. Returns { profilePictureUrl, thumbnails: { small, medium, large } }

DELETE /api/housekeepers/:id/photo
Remove profile photo -> revert to initials/default avatar

Optional / Media

POST /api/rooms/:id/media — upload photo/video for room (for media viewing in room card)

GET /api/schedule — today's schedule or date range

(Optional) GET /api/reports/daily-cleaning?date=YYYY-MM-DD

12. Data Models (example)
Room (example)
{
  "id": "room-101",
  "number": "101",
  "floor": 1,
  "status": "needs-cleaning",
  "housekeeperId": "hk-12",
  "housekeeperName": "Maya Rai",
  "checkoutTime": "2025-10-24T10:15:00+05:45",
  "lastCleaned": "2025-10-23T09:00:00+05:45",
  "notes": "Left a wet towel on the floor.",
  "media": ["https://.../room-101-1.jpg"]
}

Housekeeper (example)
{
  "id": "hk-12",
  "name": "Maya Rai",
  "role": "Housekeeper",
  "contact": "+977-98XXXXXXXX",
  "profilePictureUrl": "https://cdn.example.com/hk-12.jpg",
  "assignedRooms": ["101", "102", "110"],
  "statusCounts": { "clean": 5, "needs-cleaning": 2, "occupied": 0, "maintenance": 1 }
}

13. Implementation notes & suggestions

Use Lucide icons for status icons (CheckCircle, AlertCircle, User, Wrench).

For avatars use a component that accepts profilePictureUrl and falls back to initials.

Cropper library suggestion: any modern React cropper (allow circle or square).

Thumbnails: generate server-side on upload for performance.

Consider signed URLs for private storage.

WebSocket (socket.io or WS) for real-time updates later.

Validate uploads on frontend (size/type) and backend (mime-type, virus scan if needed).

4. Admin Dashboard (Management-Facing)
4.1 Dashboard Overview

KPIs: Revenue, Occupancy, Staff Productivity
Room Gallery & Videos Management → Upload / Edit / Delete multiple room images & videos (same visual tokens as public UI)

4.2 Room & Facility Management

CRUD operations, multiple image upload (drag & drop), video upload, ordering images, alt text fields

4.3 User Management

Staff roles, access control, two-factor for admins

4.4 OTA Integration

Sync rooms, rates, gallery images, videos with OTAs (Booking.com, Agoda, Expedia)

APIs

POST /api/ota/sync → Push room data, images & videos

GET /api/ota/bookings → Import OTA bookings

4.5 Payment & Finance

Track transactions, invoices, reconcile OTA + Direct bookings

4.6 Reports

Revenue, occupancy, housekeeping KPIs, staff performance dashboards

5. Shared Features Across All Modules

Room Gallery & Video: multiple images + video tours in Public Website, Front Office, Housekeeping, Admin (same player and lightbox across modules).

Payments: Unified payment gateway module (eSewa, Khalti, Card).

OTA Integration: Sync reservations & room content including gallery images.

Notifications: Real-time via WebSocket / server-sent events for updates (bookings, room status).

Search & Filters: Shared query contract for GET /api/rooms to keep consistent filtering across components.

Analytics Hooks: events for view_room, play_video, start_booking, complete_booking.

🆕 Guest Profile Management: Automatically generated after first booking; used across Front Office & Admin dashboards to view history, preferences, and repeat guest data.

System Flow (updated)

Guest visits Public Website → Views Rooms (styled like Home) → Opens Individual Room page → Views gallery/video → Uses Booking Form (Adults + Children) → Pays → System creates/updates Guest Profile.

Booking stored; Front Office & Admin dashboards sync and show booking; Housekeeping notified to prepare room.

When guest revisits, their profile auto-fills booking info and shows previous history.

OTA bookings sync into central reservation system; Admin reconciles.

Media management in Admin controls images/videos shown on Public Website and internal dashboards.

Important Implementation Notes (matching style & behavior)

Use the same design tokens & components across Home and Rooms pages to ensure a unified look.

Reuse the RoomCard component with small variations (preview vs full card).

Make filters server-driven and UI-driven but visually identical to the Home quick-book controls.

Images & videos must have alt text, ordering fields, and optional captions for accessibility.

Calendar uses blocked/unavailable styling consistent with rest of site color tokens (e.g., red for unavailable, green for available).

Booking form must include children count and the stepper should be used across site (Home quick-book and Room sticky booking card).

🆕 Guest Profile logic: automatically created/updated after each booking; used to track visit history, store preferences, and personalize future bookings.