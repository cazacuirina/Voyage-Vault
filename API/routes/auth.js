const express = require("express");
const router = express.Router();
const {
  loginUser,
  registerUser,
  logoutUser,
  getGoogleUser,
  googleCallback,
  redirectToGoogle,
  resetPassword
} = require("../controllers/auth");


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/google", redirectToGoogle);
router.get("/google/callback", googleCallback);
router.get("/google/user", getGoogleUser);
router.put("/reset-password", resetPassword);


module.exports = router;