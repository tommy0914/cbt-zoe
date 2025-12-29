const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

// Local Strategy for email/password login
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return done(null, false, { message: 'No user found with that email.' });
      }
      if (!user.password) {
        return done(null, false, { message: 'This account must be accessed via Google login.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // check if user already exists in our db
      const currentUser = await User.findOne({ googleId: profile.id });
      if (currentUser) {
        // already have the user
        return done(null, currentUser);
      } else {
        // Check if a user with this email already exists
        const existingUser = await User.findOne({ email: profile.emails[0].value });
        if (existingUser) {
          // Link the Google ID to the existing account
          existingUser.googleId = profile.id;
          await existingUser.save();
          return done(null, existingUser);
        }

        // if not, create a new user in our db
        const newUser = await new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        }).save();
        return done(null, newUser);
      }
    }
  )
);
