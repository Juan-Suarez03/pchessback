const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const router = require("./src/routes/router");
const myconn = require("express-myconnection");
const { database } = require("./src/views/keys");
const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// INITIALIZATION
const app = express();
const sessionStore = new MySQLStore(database);

app.set("port", process.env.PORT || 9000);

// MIDDLEWARE

app.use(cookieParser());
app.use(
  session({
    key: "session-cookie-name",
    secret: "pchessmysqlnode",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(myconn(mysql, database, "single"));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((err, req, res, next) => {
  if (err.name === "AuthenticationError") {
    res.status(401).json({ message: "Usuario o contraseña incorrectos" });
  } else {
    res.status(500).json({ message: "Error interno del servidor" });
  }
  app.locals.user = req.user;
  next();
});

//ROUTES----------------

app.use(require("./src/routes/router"));
app.use(require("./src/routes/authentication"));

app.get("/", (req, res) => {
  res.send("Welcome to my app");
});

app.use("/api", router);

//SERVER RUNNING-------------
app.listen(app.get("port"), () => {
  console.log("server in port ", app.get("port"));
});
