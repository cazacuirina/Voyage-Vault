const express = require("express");
const router = express.Router();
const { checkAuthorization } = require("../middleware/checkAuthorization");
const followRoutes = require('./followings');

const {
  getUserFavorites,
  getNewContent,
  getFinancials,
  getPayersPerPost,
  getProfilePicture,
  postProfilePicture,
  putUserSubscription,
} = require("../controllers/users");

router.get("/favorites", checkAuthorization, getUserFavorites);
router.get("/newContent", checkAuthorization, getNewContent);
router.get("/financials", checkAuthorization, getFinancials);
router.get("/payersperpost", checkAuthorization, getPayersPerPost);
router.get("/:authorName/profilePicture", getProfilePicture);
router.post("/profilePicture", checkAuthorization, postProfilePicture);
router.put("/subscription", checkAuthorization, putUserSubscription);

router.use('/:authorName', followRoutes);

module.exports = router;