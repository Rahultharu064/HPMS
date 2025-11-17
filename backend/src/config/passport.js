import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./client.js";


passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Validate that we have the required email
            if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
                console.error('Google OAuth: No email provided in profile', profile);
                return done(new Error('Email is required for authentication'), null);
            }

            const email = profile.emails[0].value;
            const googleId = profile.id;

            console.log('Google OAuth: Processing login for email:', email, 'Google ID:', googleId);

            // First, try to find by Google ID
            let guest = await prisma.guest.findUnique({ where: { googleId } });
            if (guest) {
                console.log('Google OAuth: Found existing guest by Google ID:', guest.id);
                return done(null, guest);
            }

            // If not found by Google ID, try by email
            guest = await prisma.guest.findUnique({ where: { email } });
            if (guest) {
                console.log('Google OAuth: Found existing guest by email, updating with Google ID:', guest.id);
                // Update the existing guest with Google ID
                guest = await prisma.guest.update({
                    where: { id: guest.id },
                    data: { googleId, isVerified: true },
                });
                return done(null, guest);
            }

            // If neither found, create new guest
            // Provide better defaults for name fields - ensure they are never empty
            const displayName = profile.displayName || '';
            const nameParts = displayName.split(' ').filter(part => part.trim() !== '');

            let firstName = profile.name?.givenName || nameParts[0] || 'Guest';
            let lastName = profile.name?.familyName || nameParts.slice(1).join(' ') || 'User';

            // Ensure firstName and lastName are never empty strings
            if (!firstName || firstName.trim() === '') {
                firstName = 'Guest';
            }
            if (!lastName || lastName.trim() === '') {
                lastName = 'User';
            }

            console.log('Google OAuth: Creating new guest with name:', firstName, lastName);

            const newGuest = await prisma.guest.create({
                data: {
                    email,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    googleId,
                    isVerified: true, // Google accounts are pre-verified
                    password: '', // No password needed for Google auth
                },
            });

            console.log('Google OAuth: Successfully created new guest:', newGuest.id);
            return done(null, newGuest);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }

    }
))


passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const guest = await prisma.guest.findUnique({ where: { id } });
        done(null, guest);
    }

    catch (error) {
        done(error, null);
    }
});
export default passport;
