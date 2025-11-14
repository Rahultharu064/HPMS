# Real-Time Notification System Implementation

## Backend Changes
- [x] Add notification creation and emission in bookingController.js for booking events (new bookings, status changes)
- [x] Add notification creation and emission in taskController.js for housekeeping task events (new tasks, status updates)
- [x] Ensure notification events are emitted via Socket.IO when notifications are created

## Frontend Changes
- [x] Update Header.jsx to listen for notification events via Socket.IO
- [x] Implement real-time notification count updates
- [x] Add notification dropdown with list of notifications
- [x] Add mark as read functionality in the dropdown
- [x] Update notification state management in Header component

## Testing
- [ ] Test notification creation when bookings are made
- [ ] Test notification creation when housekeeping tasks are created/updated
- [ ] Test real-time updates in admin header
- [ ] Test notification dropdown and mark as read functionality
