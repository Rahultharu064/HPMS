# TODO: Add Room Availability Feature

## Steps to Complete
- [x] Backend: Add getRoomAvailability function in roomController.js
- [x] Backend: Add route for room availability in roomRoutes.js
- [x] Frontend: Add getRoomAvailability method in roomService.js
- [x] Frontend: Create RoomAvailability.jsx component
- [x] Frontend: Add "Room Availability" to sidebar items in FrontOffice.jsx
- [x] Frontend: Add routing for the new feature
- [x] Test the component with room data

# TODO: Implement Extra Services Feature

## Steps to Complete
- [x] Backend: Update schema.prisma with ExtraService and BookingExtraService models
- [x] Backend: Run Prisma migration for new models
- [x] Backend: Create extraServiceController.js for CRUD operations on extra services
- [x] Backend: Create extraServiceRoutes.js and integrate into app.js
- [ ] Backend: Update bookingController.js to add/remove extra services to bookings
- [ ] Backend: Update paymentController.js to include extra services in checkout calculations
- [x] Frontend: Create ExtraServices.jsx component for selecting extra services
- [x] Frontend: Integrate ExtraServices into CheckInOut.jsx or GuestProfilePage.jsx
- [ ] Frontend: Update bookingService.js to handle extra services API calls
- [ ] Frontend: Update guestService.js to fetch extra services for guest profile
- [ ] Frontend: Modify checkout flow in CheckInOut.jsx to display and charge extra services
- [ ] Test the feature: Add services, view in profile, checkout payment
