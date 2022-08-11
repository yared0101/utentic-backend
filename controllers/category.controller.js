const { prisma } = require("../config");
const { error } = require("../utils");
class CategoryController {
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    newCategory = async (req, res, next) => {
        const { name, description } = req.body;
        if (!name) {
            return errror("name", "category name is required", next);
        }
        try {
            const created = await prisma.category.create({
                data: {
                    name,
                    description,
                },
            });
            return res.json({
                success: true,
                data: created,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to create category",
                next
            );
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    getCategories = async (req, res, next) => {
        try {
            return res.json({
                success: true,
                data: await prisma.category.findMany(),
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to create category",
                next
            );
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    updateCategory = async (req, res, next) => {
        if (!req.body.updateData) {
            return error("updateData", "please send updateData", next);
        }
        const { name, description } = req.body.updateData;
        try {
            const category = await prisma.category.findUnique({
                where: { id: req.query.categoryId },
            });
            if (!category) {
                return error(
                    "categoryId",
                    "no category exists with this id",
                    next,
                    404
                );
            }
            const updated = await prisma.category.update({
                where: { id: category.id },
                data: {
                    name: name || null,
                    description: description || null,
                },
            });
            return res.json({
                success: true,
                data: created,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to create category",
                next
            );
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    deleteCategory = async (req, res, next) => {
        try {
            const category = await prisma.category.findUnique({
                where: { id: req.query.categoryId },
                include: {
                    trip: true,
                },
            });
            if (!category) {
                return error(
                    "categoryId",
                    "no category exists with this id",
                    next,
                    404
                );
            }
            if (category.trip.length) {
                return error(
                    "trip",
                    "can't delete a category if it has trips registered under it",
                    next
                );
            }
            const deleted = await prisma.category.delete({
                where: { id: category.id },
            });
            return res.json({
                success: true,
                data: deleted,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to create category",
                next
            );
        }
    };
}
module.exports = new CategoryController();
