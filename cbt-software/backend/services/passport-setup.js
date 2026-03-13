const passport = require('passport');
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

// Local Strategy for email/username/password login
passport.use(
  new LocalStrategy({ usernameField: 'loginIdentifier' }, async (loginIdentifier, password, done) => {
    try {
      // Find user by either email (case-insensitive) or username
      const searchIdentifier = loginIdentifier.toLowerCase();
      const user = await User.findOne({ 
        $or: [
          { email: searchIdentifier },
          { username: searchIdentifier }
        ]
      });
      
      if (!user) {
        return done(null, false, { message: 'No user found with that email or username.' });
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
