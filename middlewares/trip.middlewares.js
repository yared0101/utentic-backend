const { prisma } = require("../config");
const { error } = require("../utils");

/**
 *
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const tripManager = async (req, res, next) => {
    const tripId = req.params.tripId;
    if (!tripId) {
        return error("tripId", "Please send trip id in the param", next, 404);
    }
    const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { organizer: { include: { managers: true } } },
    });
    if (!trip) {
        return error("trip", "no trip exists with this id", next, 404);
    }
    if (trip.deletedStatus) {
        return error(
            "trip",
            "this trip has been removed! please contact admins",
            next,
            404
        );
    }
    if (trip.organizer.creatorId === res.locals.id) {
        next();
    }
    for (let i in trip.organizer.managers) {
        if (trip.organizer.managers[i].id === res.locals.id) {
            next();
        }
    }
    return error("user", "you are unauthorized for this action", next, 403);
};
module.exports = { tripManager };
