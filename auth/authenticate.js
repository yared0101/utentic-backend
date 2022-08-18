const { verify } = require("jsonwebtoken");
const { env, prisma } = require("../config");
const { error } = require("../utils");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
const authenticate = async (req, res, next) => {
    if (!req.headers.authorization) {
        return error("accessToken", "access token was not sent", next, 401);
    }
    const accessToken = req.headers.authorization.split(" ")[1];
    let payload;
    try {
        payload = verify(accessToken, env.ACCESS_KEY);
    } catch (e) {
        return error(
            "accessToken",
            "Invalid or Expired Access Token",
            next,
            401
        );
    }
    res.locals.user = await prisma.user.findUnique({
        where: { id: payload.id },
    });
    res.locals.id = payload.id;
    if (!res.locals.user) {
        return error(
            "accessToken",
            "Your account has been permanently removed",
            next,
            401
        );
    } else if (res.locals.user.deletedStatus) {
        return error(
            "accessToken",
            "Your account has been suspended, please contact the admins",
            next,
            401
        );
    }
    next();
};
/**
 *
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
const isAdmin = async (_req, res, next) => {
    if (res.locals.user.isAdmin) {
        return next();
    } else {
        return error(
            "user",
            "you aren't authorized to make this operation",
            next,
            403
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
const verifyTempToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return error(
            "tempToken",
            "temporary access token was not sent",
            next,
            401
        );
    }
    const accessToken = req.headers.authorization.split(" ")[1];
    let payload;
    try {
        payload = verify(accessToken, env.TEMP_TOKEN_ACCESS_KEY);
        res.locals.tempUser = await prisma.user.findUnique({
            where: { id: payload.tempId },
        });
        res.locals.tempId = payload.tempId;
        if (!res.locals.tempUser) {
            return error(
                "tempToken",
                "Your account has been permanently removed",
                next,
                401
            );
        }
        return next();
    } catch (e) {
        console.log(e);
        return error(
            "tempToken",
            "session has expired, request code again",
            next,
            401
        );
    }
};
module.exports = { authenticate, isAdmin, verifyTempToken };
