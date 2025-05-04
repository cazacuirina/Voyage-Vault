const express = require("express");
const router = express.Router();
const { checkAuthorization } = require("../middleware/checkAuthorization");
const followRoutes = require('./followings');

const {
  getUserFavorites,
  getNewContent,
  getTrips,
  getFinancials,
  getPayersPerPost,
  getProfilePicture,
  postProfilePicture,
  postTrip,
  putUserSubscription,
  putUserTrip,
  deleteUserTrip
} = require("../controllers/users");

router.get("/favorites", checkAuthorization, getUserFavorites);
router.get("/newContent", checkAuthorization, getNewContent);
router.get("/trips", checkAuthorization, getTrips);
router.get("/financials", checkAuthorization, getFinancials);
router.get("/payersperpost", checkAuthorization, getPayersPerPost);
router.get("/:authorName/profilePicture", getProfilePicture);
router.post("/profilePicture", checkAuthorization, postProfilePicture);
router.post("/trip", checkAuthorization, postTrip);
router.put("/subscription", checkAuthorization, putUserSubscription);
router.put("/trips/:tripId", checkAuthorization, putUserTrip);
router.delete("/trips/:tripId", checkAuthorization, deleteUserTrip);

router.use('/:authorName', followRoutes);

module.exports = router;