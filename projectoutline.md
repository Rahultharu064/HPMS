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
3.1 Dashboard Overview

Room status map (VC, VD, OC, OD, OOO), KPIs: cleaned rooms, pending tasks

3.2 Room Cleaning Tasks

Task table with real-time updates, linked room gallery & videos for cleaning guidelines

3.3 Inventory Management

Low-stock alerts, product analytics

3.4 Special Guest Requests

Assign staff, mark complete

3.5 Reports & Logs

Cleaning reports, lost & found, staff performance

3.6 Maintenance & Safety

Scheduled inspections, safety logs, room video inspection records

3.7 Notifications

Sync with Front Office: Vacant Dirty → Clean → Ready

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