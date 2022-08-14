const express = require("express");
const { authenticate } = require("../auth/authenticate");
const {
    addImages,
    getTrips,
    getWithId,
    newTrip,
    removeImage,
    updateTrip,
    activateTrip,
    deactivateTrip,
} = require("../controllers/trip.controller");
const router = express.Router();

const multer = require("multer");
const { tripManager } = require("../middlewares/trip.middlewares");
const upload = multer({ dest: "tempFiles/" });

router.post("/", authenticate, newTrip);
router.get("/", authenticate, getTrips); //all trips, apply filters and stuff in the resolver
router.get("/:tripId", authenticate, getWithId); //a single trip, apply filters and stuff in the resolver
router.patch("/update-info/:tripId", authenticate, tripManager, updateTrip);
router.patch(
    "/add-images/:tripId",
    authenticate,
    tripManager,
    upload.array("image[]"),
    addImages
);
router.patch("/remove-image/:tripId", authenticate, tripManager, removeImage);
router.delete("/disable-trip/:tripId", authenticate, tripManager, activateTrip);
router.post("/enable-trip/:tripId", authenticate, tripManager, deactivateTrip);

module.exports = router;
