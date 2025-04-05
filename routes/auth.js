const express = require('express');
const router = express.Router();
const User = require('../models/User');
const passport = require('passport');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('user_data.db');

// ✅ Allow users to select interests during signup
const categories = ['Electronics', 'Fashion', 'Books', 'Beauty', 'Sports', 'Toys', 'Home', 'Gaming'];

router.get('/register', (req, res) => {
    res.render('auth/signup', { categories });
});

router.post('/register', async (req, res) => {
    try {
        let { email, username, password, role, interests } = req.body;
        const user = new User({ email, username, role, interests: interests || [] });
        const newUser = await User.register(user, password);

        req.login(newUser, function(err) {
            if (err) return next(err);
            req.flash('success', 'Welcome, you are registered successfully!');
            syncUserToSQLite(newUser._id.toString(), newUser.interests);
            return res.redirect('/products');
        });
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('/register');
    }
});

router.get('/login', (req, res) => {
    res.render('auth/login');
});

async function syncUserToSQLite(userId, interests = []) {
  try {
      const user = await User.findById(userId);
      if (!user) return;

      const history = user.browsingHistory?.join(', ') || 'No recent browsing';
      const interestStr = (interests.length > 0) ? interests.join(', ') : 'None selected';

      const db = new sqlite3.Database('user_data.db');
      db.run(`
          CREATE TABLE IF NOT EXISTS users (
              user_id TEXT PRIMARY KEY,
              interests TEXT,
              history TEXT
          )
      `);

      db.run(`
          INSERT OR REPLACE INTO users (user_id, interests, history)
          VALUES (?, ?, ?)
      `, [userId, interestStr, history], (err) => {
          if (err) console.error("SQLite insert error:", err.message);
          db.close();
      });

      console.log(`✅ Synced user ${userId} to SQLite with interests: ${interestStr}`);
  } catch (error) {
      console.error("Error syncing user to SQLite:", error);
  }
}


// ✅ Function to sync user interests to SQLite

router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureMessage: true,
  }),
  function (req, res) {
    const userId = req.user._id.toString();
    syncUserToSQLite(userId, req.user.interests);
    req.flash('success', `Welcome back, ${req.user.username}!`);
    res.redirect('/products');
  }
);


const cron = require('node-cron');

// Background job to sync interests every 1 hour
cron.schedule('0 * * * *', async () => {
    console.log("⏳ Syncing user interests to SQLite...");
    const users = await User.find({});
    users.forEach(user => {
        db.run(`UPDATE users SET interests = ? WHERE user_id = ?`, 
               [user.interests.join(', '), user._id.toString()]);
    });
    console.log("✅ Interests synced to SQLite!");
});


// router.get('/logout', (req, res) => {
//   console.log("Logout route hit");
//   req.logout(() => {
//       req.flash('success', 'Goodbye, friend!');
//       res.redirect('/login');
//   });
// });



router.get('/logout', (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
    

});
router.post('/logout', async (req, res, next) => {
  console.log("Logout route hit");
  
  // Store flash message before destroying session
  req.flash('success', 'Goodbye, friend!');
  
  req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
          if (err) return next(err);
          res.clearCookie('connect.sid'); // Clear session cookie
          res.redirect('/login');
      });
  });
});







module.exports = router;



