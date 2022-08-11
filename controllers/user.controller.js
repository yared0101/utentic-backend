const { hash } = require("bcrypt");
const { prisma } = require("../config");
const { VALIDATION_TYPE } = require("../config/constants");
const { getOneUser, updateUser } = require("../services/user.services");
const { error } = require("../utils");
const { uploadFile } = require("../utils/upload");
const { validatePhoneNumber, allValidations } = require("../utils/validation");
class UserController {
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    login = async (req, res, next) => {
        if (!req.body.username && !req.body.email && !req.body.phoneNumber) {
            return error(
                "identifier",
                "please send username email or phone number",
                next
            );
        }
        if (!req.body.password) {
            return error("password", "password can't be empty", next);
        }
        const { username, email, phoneNumber, password, keepMeLoggedIn } =
            req.body;
        const identifier = [
            { value: username, key: "username" },
            { value: email, key: "email" },
            { value: phoneNumber, key: "phoneNumber" },
        ].find((elem) => elem.value);
        console.log(await user.findMany());
        const queryResult = await prisma.user.findUnique({
            where: { [identifier.key]: identifier.value },
            select: {
                password: true,
                id: true,
            },
        });
        const key = identifier.key;
        if (!queryResult) {
            return error(key, "Invalid credentials", next);
        }
        if (queryResult.deleted_status) {
            return error(key, "account has been deleted", next);
        }
        const correctPassword = await compare(password, queryResult.password);
        if (!correctPassword) {
            return error("password", "Invalid credentials", next);
        }
        const accessToken = sign(
            {
                id: queryResult.id,
            },
            process.env.ACCESS_KEY,
            keepMeLoggedIn ? {} : { expiresIn: "10h" }
        );
        return res.json({
            accessToken,
            id: queryResult.id,
        });
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    signUp = async (req, res, next) => {
        if (!req.body.phoneNumber) {
            return error("identifier", "please send phone number", next);
        }
        if (!req.body.firstName) {
            return error("identifier", "please send phone number", next);
        }
        if (!req.body.password) {
            return error("password", "password can't be empty", next);
        }
        const { phoneNumber, firstName, password } = req.body;
        const [{ success, message, argument }] = allValidations([
            {
                type: VALIDATION_TYPE.PHONE_NUMBER,
                value: phoneNumber,
                argument: "phoneNumber",
            },
        ]);
        if (!success) {
            return error(argument, message, next);
        }
        const userExists = await prisma.user.findUnique({
            where: { phoneNumber },
        });
        if (userExists) {
            return error(
                "phoneNumber",
                "user with the same phone number already exists",
                next
            );
        }
        const newUser = await prisma.user.create({
            data: {
                phoneNumber,
                firstName,
                password: await hash(password, 10),
            },
        });
        const accessToken = sign(
            {
                id: newUser.id,
            },
            process.env.ACCESS_KEY,
            { expiresIn: "7d" }
        );
        return res.json({
            accessToken,
            id: newUser.id,
        });
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    updateSelf = async (req, res, next) => {
        if (!req.body.updateData) {
            return error("updateData", "please send updateData", next);
        }
        return updateUser(res.locals.id, req.body.updateData, next);
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    updatePassword = async (req, res, next) => {
        if (!req.body.password) {
            return error("password", "please send password", next);
        }
        if (!req.body.newPassword) {
            return error("newPassword", "please send new password", next);
        }
        const { password, newPassword } = req.body;
        const queryResult = res.locals.user;
        const correctPassword = await compare(password, queryResult.password);
        if (!correctPassword) {
            return error("password", "Invalid credentials", next);
        }
        await prisma.user.update({
            where: {
                id: queryResult.id,
            },
            data: {
                password: await hash(newPassword, 10),
            },
        });
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    updateProfile = async (req, res, next) => {
        try {
            const profile = await uploadFile(
                req.file.path,
                "USER",
                res.locals.id,
                false
            );
            await prisma.user.update({
                where: { id: res.locals.id },
                data: { profile },
            });
        } catch (e) {
            return error("server", "upload failed please try again", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    updateBanner = async (req, res, next) => {
        try {
            const banner = await uploadFile(
                req.file.path,
                "USER",
                res.locals.id,
                true
            );
            await prisma.user.update({
                where: { id: res.locals.id },
                data: { banner },
            });
        } catch (e) {
            return error("server", "upload failed please try again", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    getMe = async (req, res, next) => {
        return getOneUser(res.locals.id, next);
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    getWithId = async (req, res, next) => {
        return getOneUser(req.params.id, next);
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    getAll = async (req, res, next) => {
        const { communityId, tripId, limit, skip } = req.query;
        let filterLimit = Number(limit) || null;
        let filterSkip = Number(skip) || null;
        try {
            const users = await prisma.user.findMany({
                where: {
                    followedCommunities: {
                        some: {
                            id: communityId | null,
                        },
                    },
                    bookedTrips: {
                        some: {
                            id: tripId | null,
                        },
                    },
                },
                include: {
                    _count: true,
                    bookedTrips: { select: { _count: true } },
                    createdCommunities: { select: { _count: true } },
                    followedCommunities: { select: { _count: true } },
                    managedCommunities: { select: { _count: true } },
                    organizedTrips: { select: { _count: true } },
                    sharedTrips: { select: { _count: true } },
                },
            });
            return res.json({
                success: true,
                data: users,
            });
        } catch (e) {
            return error(
                "server",
                "something went wrong in retriving the account informations",
                next,
                500
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
    followCommunity = async (req, res, next) => {
        try {
            const community = await prisma.community.findUnique({
                where: { id: req.params.communityId },
            });
            if (!community) {
                return error(
                    "communityId",
                    "no community found with this id",
                    next,
                    404
                );
            }
            await prisma.user.update({
                where: {
                    id: res.locals.id,
                },
                data: {
                    followedCommunities: {
                        connect: {
                            id: community.id,
                        },
                    },
                },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    unFollowCommunity = async (req, res, next) => {
        try {
            const community = await prisma.community.findUnique({
                where: { id: req.params.communityId },
            });
            if (!community) {
                return error(
                    "communityId",
                    "no community found with this id",
                    next,
                    404
                );
            }
            if (community.creatorId === res.locals.id) {
                return error(
                    "communityId",
                    "you can't follow your own community",
                    next
                );
            }
            await prisma.user.update({
                where: {
                    id: res.locals.id,
                },
                data: {
                    followedCommunities: {
                        disconnect: {
                            id: community.id,
                        },
                    },
                    managedCommunities: {
                        disconnect: {
                            id: community.id,
                        },
                    },
                },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    bookTrip = async (req, res, next) => {
        try {
            const trip = await prisma.trip.findUnique({
                where: { id: req.params.tripId },
            });
            if (!trip) {
                return error("tripId", "no trip found with this id", next, 404);
            }
            await prisma.user.update({
                where: { id: res.locals.id },
                data: { bookedTrips: { connect: { id: trip.id } } },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    unBookTrip = async (req, res, next) => {
        try {
            const trip = await prisma.trip.findUnique({
                where: { id: req.params.tripId },
            });
            if (!trip) {
                return error("tripId", "no trip found with this id", next, 404);
            }
            await prisma.user.update({
                where: { id: res.locals.id },
                data: { bookedTrips: { disconnect: { id: trip.id } } },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    activateUser = async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.params.userId },
            });
            if (!user) {
                return error("user", "no user found with this id", next, 404);
            }
            await prisma.user.update({
                where: { id: user.id },
                data: { deletedStatus: false },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    deactivateUser = async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.params.userId },
            });
            if (!user) {
                return error("user", "no user found with this id", next, 404);
            }
            await prisma.user.update({
                where: { id: user.id },
                data: { deletedStatus: true },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    removeUser = async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.params.userId },
            });
            if (!user) {
                return error("tripId", "no trip found with this id", next, 404);
            }
            await prisma.user.delete({
                where: { id: user.id },
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
}
module.exports = new UserController();
