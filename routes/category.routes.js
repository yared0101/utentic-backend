const express = require("express");
const { authenticate, isAdmin } = require("../auth/authenticate");
const {
    deleteCategory,
    getCategories,
    newCategory,
    updateCategory,
} = require("../controllers/category.controller");
const router = express.Router();

router.post("/", authenticate, isAdmin, newCategory);
router.get("/", authenticate, getCategories);
router.patch("/:categoryId", authenticate, isAdmin, updateCategory);
router.delete("/:categoryId", authenticate, isAdmin, deleteCategory);
module.exports = router;
