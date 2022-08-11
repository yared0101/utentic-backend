const express = require("express");
const router = express.Router();

const categoryRoutes = require("./category.routes");
const communityRoutes = require("./community.routes");
const tripRoutes = require("./trip.routes");
const userRoutes = require("./user.routes");

router.use("/categories", categoryRoutes);
router.use("/trips", tripRoutes);
router.use("/communities", communityRoutes);
router.use("/user", userRoutes);

module.exports = router;
