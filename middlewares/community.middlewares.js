const { prisma } = require("../config");
const { error } = require("../utils");

/**
 *
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
const communityManager = async (req, res, next) => {
    const communityId = req.params.communityId;
    if (!communityId) {
        return error(
            "communityId",
            "Please send community id in the param",
            next,
            404
        );
    }
    const community = await prisma.community.findUnique({
        where: { id: communityId },
        include: { managers: true },
    });
    if (!community) {
        return error(
            "community",
            "no community exists with this id",
            next,
            404
        );
    }
    if (community.deletedStatus) {
        return error(
            "community",
            "this community has been suspended! please contact admins",
            next,
            404
        );
    }
    community.creatorId === res.locals.id && next();
    for (let i in community.managers) {
        if (community.managers[i].id === res.locals.id) {
            next();
        }
    }
    return error("user", "you are unauthorized for this action", next, 403);
};
/**
 *
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
const communityCreator = async (req, res, next) => {
    const communityId = req.params.communityId;
    if (!communityId) {
        return error(
            "communityId",
            "Please send community id in the param",
            next,
            404
        );
    }
    const community = await prisma.community.findUnique({
        where: { id: communityId },
        include: { managers: true },
    });
    if (!community) {
        return error(
            "community",
            "no community exists with this id",
            next,
            404
        );
    }
    if (community.deletedStatus) {
        return error(
            "community",
            "this community has been suspended! please contact admins",
            next,
            404
        );
    }
    community.creatorId === res.locals.id && next();
    return error("user", "you are unauthorized for this action", next, 403);
};
module.exports = { communityManager, communityCreator };
