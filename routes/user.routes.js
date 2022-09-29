const express = require("express");
const {
    authenticate,
    isAdmin,
    verifyTempToken,
} = require("../auth/authenticate");
const UserController = require("../controllers/user.controller");
const router = express.Router();
const {
    Prisma: { UserScalarFieldEnum },
} = require("@prisma/client");
const multer = require("multer");
const { inputCleanUp } = require("../middlewares/validation.middlewares");
const upload = multer({ dest: "tempFiles/" });
// const userHandlers = new UserController();
const {
    signUp,
    resendPin,
    login,
    getMe,
    updatePassword,
    updateSelf,
    getAll,
    getWithId,
    bookTrip,
    followCommunity,
    unBookTrip,
    unFollowCommunity,
    activateUser,
    deactivateUser,
    removeUser,
    updateBanner,
    updateProfile,
} = UserController;

//#region auth actions
router.post("/login", login); //login(u get accesstoken here)
router.post("/signup", signUp); //signup(u get temp token here)
router.post("/resend-pin", verifyTempToken, resendPin); //resend if sending was failure;
//#endregion

//#region self Actions
router.patch("/", authenticate, updateSelf); //update self
router.patch("/update-password", authenticate, updatePassword);
router.patch(
    "/change-profile",
    authenticate,
    upload.single("profile"),
    updateProfile
);
router.patch(
    "/change-banner",
    authenticate,
    upload.single("banner"),
    updateBanner
);
router.get("/me", authenticate, getMe); //get all data about me, include everything
//#endregion

//#region social actions
router.get("/", authenticate, getAll); //all users
router.get("/:userId", authenticate, getWithId); //a single user
router.post("/follow/:communityId", authenticate, followCommunity);
router.post("/un-follow/:communityId", authenticate, unFollowCommunity);
router.post("/book-trip/:tripId", authenticate, bookTrip);
router.post("/unbook-trip/:tripId", authenticate, unBookTrip);

//#region admin actions
// router.post("/add-user", authenticate, isAdmin, login); //skipped
router.post("/activate-user/:userId", authenticate, isAdmin, activateUser);
router.delete("/suspend-user/:userId", authenticate, isAdmin, deactivateUser);
router.delete("/remove-user/:userId", authenticate, isAdmin, removeUser);
// router.patch("/update-user/:userId", authenticate, isAdmin, login); //not allowed hopefully
//#endregion
module.exports = router;
