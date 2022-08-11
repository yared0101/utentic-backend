const express = require("express");
const { authenticate } = require("../auth/authenticate");
const {
    activateCommunity,
    activateTrip,
    addManagers,
    deactivateCommunity,
    deactivateTrip,
    getCommunities,
    getWithId,
    newCommunity,
    removeManagers,
    updateBanner,
    updateCommunity,
    updateProfile,
} = require("../controllers/community.controller");
const router = express.Router();

const multer = require("multer");
const {
    communityManager,
    communityCreator,
} = require("../middlewares/community.middlewares");
const upload = multer({ dest: "tempFiles/" });

router.post(
    "/",
    authenticate,
    upload.fields([
        {
            name: "profile",
            maxCount: 1,
        },
        {
            name: "banner",
            maxCount: 1,
        },
    ]),
    newCommunity
);
router.get("/", authenticate, getCommunities); //get all communities
router.get("/:communityId", authenticate, getWithId); //get a single community
router.patch(
    "/update-community-info/:communityId",
    authenticate,
    communityManager,
    updateCommunity
);
router.patch(
    "/change-community-profile/:communityId",
    authenticate,
    communityManager,
    upload.single("profile"),
    updateProfile
);
router.patch(
    "/change-community-banner/:communityId",
    authenticate,
    communityManager,
    upload.single("banner"),
    updateBanner
);
router.delete(
    "/deactivate-community/:communityId",
    authenticate,
    communityCreator,
    deactivateCommunity
);
router.post(
    "/activate-community/:communityId",
    authenticate,
    communityCreator,
    activateCommunity
);
router.post(
    "/add-manager/:communityId",
    authenticate,
    communityCreator,
    addManagers
);
router.post(
    "/remove-manager/:communityId",
    authenticate,
    communityCreator,
    removeManagers
);

module.exports = router;
