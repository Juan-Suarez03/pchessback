const express = require("express");
const router = express.Router();
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const db = require("../views/database");
const helpers = require("../lib/helpers");
const bcrypt = require("bcryptjs");

passport.use(
  "local.signin",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      const rows = await db.query("SELECT * FROM users WHERE username = ?", [
        username,
      ]);
      if (rows.length > 0) {
        console.log(req.body);
        const user = rows[0];
        const validPassword = await bcrypt.compare(
          password,
          user.password,
          function (err, resp) {
            if (resp) {
              console.log(
                "Las contraseñas coinciden, Welcome " + user.username
              );
              done(null, user, { message: "usuario Verificado" });
            } else {
              console.log("Las contraseñas NO coinciden");
              done(null, false, { message: "Las constrasenas no coinciden!" });
            }
          }
        );
      } else {
        console.log("username equivocado");
        return done(null, false, { message: "USUARIO NO ENCONTRADO" });
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
passport.use(
  "local.signup",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      const email = req.body.email;
      const newUser = {
        username,
        password,
        email: email,
      };
      newUser.password = await helpers.encryptPassword(password);
      const result = await db.query("INSERT INTO users SET ?", [newUser]);
      const resul2 = await db.query(
        "INSERT INTO best (user_id, score) VALUES (? , ?)",
        [newUser.username, 0]
      );
      newUser.id = result.insertId;
      return done(null, newUser, req.flash("Usuario creado correctamente"));
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  done(null, rows[0]);
});

// GET USERS!-------
router.get("/users", (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query("SELECT * FROM users", (err, rows) => {
      if (err) return res.send(err);

      res.json(rows);
    });
  });
});

// GET BEST PLAYERS
router.get("/best", (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query(
      // "SELECT u.id, u.username, b.score FROM bestplayers b JOIN users u ON b.user_id = u.id ORDER BY b.score DESC LIMIT 10",
      "SELECT * FROM best ORDER BY score DESC LIMIT 10;",
      (err, rows) => {
        if (err) return res.send(err);

        res.json(rows);
      }
    );
  });
});
// REGISTER---------------------------------------------
router.post(
  "/register",
  passport.authenticate("local.signup", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
  (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.send(err);

      conn.query("INSERT INTO users set ? ", [newUser], (err, rows) => {
        if (err) return res.send(err);

        res.send("The user has been added");
      });
    });
  }
);

// LOGIN--------------------------------------------

router.post("/login", (req, res, next) => {
  passport.authenticate("local.signin", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json({ success: false, send: true, message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({
        success: true,
        send: true,
        message: info.message,
        user: { username: user.username, id: user.id },
      });
    });
  })(req, res, next);
});

// LOGOUT
router.get("/logout", (req, res) => {
  req.logout();
  res.json({
    success: true,
    send: true,
    user: {},
  });
});

// DELETE------------------

router.delete("/:id", (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query(
      "DELETE FROM users WHERE id = ? ",
      [req.params.id],
      (err, rows) => {
        if (err) return res.send(err);

        res.send("The user has been deleted");
      }
    );
  });
});

// UPDATE--------------------------------

router.put("/:id", (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query(
      "UPDATE users set ? WHERE id = ? ",
      [req.body, req.params.id],
      (err, rows) => {
        if (err) return res.send(err);

        res.send("The user has been updated");
      }
    );
  });
});

module.exports = router;
