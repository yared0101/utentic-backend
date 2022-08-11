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
    login,
    getMe,
    signUp,
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
router.post("/login", login);
router.post(
    "/signup",
    // inputCleanUp(UserScalarFieldEnum), //example of usage, deal with input filters later
    signUp
);
router.post("/forgot-password", login); //send email
router.post("/verify-otp", login); //send otp
router.post("/change-forgotten-password", verifyTempToken, login);
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
    upload.single("profile"),
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
router.post("/add-user", authenticate, isAdmin, login); //skipped
router.post("/activate-user/:userId", authenticate, isAdmin, activateUser);
router.delete("/suspend-user/:userId", authenticate, isAdmin, deactivateUser);
router.delete("/remove-user/:userId", authenticate, isAdmin, removeUser);
router.patch("/update-user/:userId", authenticate, isAdmin, login); //not allowed hopefully
//#endregion
module.exports = router;
