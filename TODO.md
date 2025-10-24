# TODO: Implement OCR Scanner for Government ID Proof Upload

## Steps to Complete

- [x] Update backend/package.json to add tesseract.js dependency
- [x] Modify backend/src/controllers/bookingController.js to integrate OCR in uploadIdProof function
  - [x] Import tesseract.js
  - [x] Add OCR processing after image validation
  - [x] Extract text from image using OCR
  - [x] Check for ID-related keywords in extracted text
  - [x] Attempt to match extracted ID number with provided idNumber
  - [x] Validate that the uploaded image matches the guest's selected ID type (e.g., citizenship, passport)
  - [x] Reject upload if ID type doesn't match or cannot be detected
  - [x] Log OCR results (confidence, match status, detected ID type) in workflow log remarks
  - [x] Handle OCR failures gracefully without blocking upload
- [x] Install dependencies and test OCR with sample images
- [x] Verify error handling and logging
- [x] Implement ID type validation to ensure uploaded image matches guest's selected ID type
- [x] Create frontend ID proof scanner component with proper UI design
- [x] Integrate scanner component into booking form
- [x] Add real-time ID type validation and user feedback

# TODO: Implement Booking Success Email Notification

## Steps to Complete

- [x] Add `nodemailer` dependency to `backend/package.json`
- [x] Create `backend/src/services/emailService.js` with function to send booking success emails
- [x] Modify `backend/src/controllers/bookingController.js` to call email service when booking status changes to 'confirmed'
- [x] Install dependencies using `npm install`
- [x] Set up SMTP configuration in environment variables (e.g., EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS)
- [x] Test email sending functionality
- [x] Update frontend `BookingSuccess.jsx` to show email confirmation message when booking is confirmed
