const express = require("express");
const { authenticate, isAdmin } = require("../auth/authenticate");
const {
    deleteCategory,
    getCategories,
    newCategory,
    updateCategory,
} = require("../controllers/category.controller");
const router = express.Router();

const multer = require("multer");
const { tripManager } = require("../middlewares/trip.middlewares");
const upload = multer({ dest: "tempFiles/" });

router.post("/", authenticate, isAdmin, newCategory);
router.get("/", authenticate, getCategories);
router.update("/:categoryId", authenticate, isAdmin, updateCategory);
router.delete("/:categoryId", authenticate, isAdmin, deleteCategory);
module.exports = router;
