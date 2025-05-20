const express = require("express");
const router = express.Router();
const { checkAuthorization } = require("../middleware/checkAuthorization");

const {
  getTrips,
  postTrip,
  putUserTrip,
  deleteUserTrip
} = require("../controllers/trips");

router.get("/", checkAuthorization, getTrips);
router.post("/", checkAuthorization, postTrip);
router.put("/:tripId", checkAuthorization, putUserTrip);
router.delete("/:tripId", checkAuthorization, deleteUserTrip);

module.exports = router;