# TODO: Fix Guest Registration Issues

## Current Status
- Registration fails due to email verification setup problems
- Verification token not stored in DB
- Email sending errors not handled

## Tasks
- [ ] Add verificationToken field to Guest model in schema.prisma
- [ ] Run Prisma migration for the new field
- [ ] Update authController.js to store token and handle email errors
- [ ] Update verifyEmail function to use token properly
- [ ] Test registration flow (run server and attempt registration)

## Notes
- Ensure EMAIL_USER and EMAIL_PASS env vars are set for email sending
- After fixes, test both successful registration and error cases
