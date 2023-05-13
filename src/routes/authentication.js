const express = require("express");
const router = express.Router();

const passport = require("passport");

router.post("/signup", (req, res) => {
  passport.authenticate("local.signup", {
    successRedirect: "http://localhost:3000",
    failureRedirect: "http://localhost:3000/register",
  });
});

module.exports = router;
