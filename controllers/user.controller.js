const { hash, compare } = require("bcrypt");
const e = require("express");
const { sign } = require("jsonwebtoken");
const { prisma } = require("../config");
const { VALIDATION_TYPE } = require("../config/constants");
const { getOneUser, updateUser } = require("../services/user.services");
const { error } = require("../utils");
const { sendVerificationSms } = require("../utils/sms");
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
    verifyPin = async (req, res, next) => {
        try {
            if (!req.body.pin) {
                return error(
                    "pin",
                    "please send pin sent to your phone number",
                    next
                );
            }
            const pin = String(req.body.pin);
            const queryResult = await prisma.user.findUnique({
                where: { id: res.locals.tempId },
            });
            const key = "pin";
            if (!queryResult) {
                return error(key, "Invalid credentials", next);
            }
            if (queryResult.deletedStatus) {
                return error(key, "account has been deleted", next);
            }
            const correctPassword = await compare(pin, queryResult.password);
            if (!correctPassword) {
                return error("pin", "Wrong Code", next);
            }
            const accessToken = sign(
                {
                    id: queryResult.id,
                },
                process.env.ACCESS_KEY
            );
            return res.json({
                accessToken,
                id: queryResult.id,
                user: queryResult,
            });
        } catch (e) {
            console.log(e);
            return error("server", "login failed please try again", next, 500);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    auth = async (req, res, next) => {
        try {
            if (!req.body.phoneNumber) {
                return error("phoneNumber", "please send phone number", next);
            }
            const [{ success, message, argument, value }] = allValidations([
                {
                    type: VALIDATION_TYPE.PHONE_NUMBER,
                    value: req.body.phoneNumber,
                    argument: "phoneNumber",
                },
            ]);
            const phoneNumber = value;

            if (!success) {
                return error(argument, message, next);
            }
            const userExists = await prisma.user.findUnique({
                where: { phoneNumber },
            });
            if (!userExists) {
                var newUser = await prisma.user.create({
                    data: {
                        phoneNumber,
                    },
                });
            }
            const userId = userExists?.id || newUser?.id;
            if (!userId) {
                //means user doesn't exist or wasnt created which is a server error
                throw "huge error";
            }
            const accessToken = sign(
                {
                    tempId: userId,
                },
                process.env.TEMP_TOKEN_ACCESS_KEY,
                { expiresIn: "1h" }
            );
            const code = Math.floor(Math.random() * 100000);
            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    password: await hash(`${code}`, 10),
                },
            });
            await sendVerificationSms(phoneNumber, code);
            return res.json({
                tempToken: accessToken,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "sign up failed please try again",
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
    resendPin = async (req, res, next) => {
        try {
            const code = Math.floor(Math.random() * 100000);
            const user = await prisma.user.update({
                where: {
                    id: res.locals.tempId,
                },
                data: {
                    password: await hash(`${code}`, 10),
                },
            });
            await sendVerificationSms(user.phoneNumber, code);
            return res.json({ success: true });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "sign up failed please try again",
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
    updateSelf = async (req, res, next) => {
        if (!req.body.updateData) {
            return error("updateData", "please send updateData", next);
        }
        const returnVal = await updateUser(
            res.locals.id,
            req.body.updateData,
            next
        );
        if (returnVal) {
            return res.json(returnVal);
        } else {
            return returnVal;
        }
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
        try {
            const queryResult = res.locals.user;
            const correctPassword = await compare(
                password,
                queryResult.password
            );
            if (!correctPassword) {
                return error("password", "Invalid credentials", next);
            }
            const updatedUser = await prisma.user.update({
                where: {
                    id: queryResult.id,
                },
                data: {
                    password: await hash(newPassword, 10),
                },
            });
            return res.json({ success: true, data: updatedUser });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "updating password please try again",
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
    updateProfile = async (req, res, next) => {
        try {
            const profile = await uploadFile(
                req.file.path,
                "USER",
                res.locals.id,
                false
            );
            const updatedUser = await prisma.user.update({
                where: { id: res.locals.id },
                data: { profile },
            });
            return res.json({ success: true, data: updatedUser });
        } catch (e) {
            console.log(e);
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
            const updatedUser = await prisma.user.update({
                where: { id: res.locals.id },
                data: { banner },
            });
            return res.json({ success: true, data: updatedUser });
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
        const returnVal = await getOneUser(res.locals.id, next);
        if (returnVal) {
            return res.json(returnVal);
        } else {
            return returnVal;
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    getWithId = async (req, res, next) => {
        const returnVal = await getOneUser(req.params.userId, next);
        if (returnVal) {
            return res.json(returnVal);
        } else {
            return returnVal;
        }
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
        let filterLimit = Number(limit) || undefined;
        let filterSkip = Number(skip) || undefined;
        try {
            const users = await prisma.user.findMany({
                where: {
                    followedCommunities: communityId
                        ? {
                              some: {
                                  id: communityId || undefined,
                              },
                          }
                        : communityId,
                    bookedTrips: tripId
                        ? {
                              some: {
                                  id: tripId || undefined,
                              },
                          }
                        : undefined,
                },
                take: filterLimit,
                skip: filterSkip,
                include: {
                    _count: true,
                    followedCommunities: { take: 3 },
                },
            });
            return res.json({
                success: true,
                data: users,
            });
        } catch (e) {
            console.log(e);
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
            const updatedUser = await prisma.user.update({
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
            return res.json({
                success: true,
                data: updatedUser,
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
            return res.json({ success: true });
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
            return res.json({ success: true });
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
            return res.json({ success: true });
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
            return res.json({ success: true });
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
            return res.json({ success: true });
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
            return res.json({ success: true });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
}
module.exports = new UserController();
