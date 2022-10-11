const { prisma, amplitudeClient } = require("../config");
const { VALIDATION_TYPE } = require("../config/constants");
const { error } = require("../utils");
const { uploadFile } = require("../utils/upload");
const { allValidations } = require("../utils/validation");

class TripController {
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    newTrip = async (req, res, next) => {
        const inputFilter = {
            departure: {
                required: true,
                validate: VALIDATION_TYPE.DATE,
            },
            return: {
                required: true,
                validate: VALIDATION_TYPE.DATE,
            },
            name: {
                required: true,
            },
            destination: {
                required: true,
            },
            price: {
                required: true,
                validate: VALIDATION_TYPE.NUMBER,
            },
            meetUpLocation: {
                required: true,
            },
            categoryId: {
                required: true,
            },
            organizerId: {
                required: true,
            },
            description: {
                required: false,
            },
            packageIncludes: {
                required: false,
                validate: VALIDATION_TYPE.ARRAY,
            },
            activities: {
                required: false,
                validate: VALIDATION_TYPE.ARRAY,
            },
            discountAmount: {
                required: false,
                validate: VALIDATION_TYPE.NUMBER,
            },
        };
        for (let i in inputFilter) {
            if (inputFilter[i].required) {
                if (!req.body[i]) {
                    return error(i, `${i} is required`, next);
                }
            }
            if (inputFilter[i].validate && req.body[i]) {
                const [{ success, message, value, argument }] = allValidations([
                    {
                        argument: i,
                        type: inputFilter[i].validate,
                        value: req.body[i],
                    },
                ]);
                if (!success) {
                    return error(i, message, next);
                }
                req.body[i] = value;
            }
        }
        const {
            departure,
            name,
            description,
            destination,
            price,
            meetUpLocation,
            packageIncludes,
            activities,
            categoryId,
            discountAmount,
            organizerId,
        } = req.body;
        const returnDate = req.body.return;
        try {
            const category = await prisma.category.findUnique({
                where: {
                    id: categoryId,
                },
            });
            if (!category) {
                return error(
                    "categoryId",
                    "no category exists with this id",
                    next
                );
            }
            const community = await prisma.community.findUnique({
                where: {
                    id: organizerId,
                },
                include: {
                    managers: true,
                },
            });
            if (!community) {
                return error(
                    "communityId",
                    "no community exists with this id",
                    next
                );
            }
            if (
                !(
                    community.managers.find(
                        (elem) => elem.id === res.locals.id
                    ) || community.creatorId === res.locals.id
                )
            ) {
                return error(
                    "user",
                    "you aren't authorized to post trips under this community",
                    next
                );
            }
            const discounted = Boolean(discountAmount);
            // console.log(startDate, endDate, departure, returnDate);
            const trip = await prisma.trip.create({
                data: {
                    departure,
                    name,
                    description,
                    destination,
                    price: Number(price) || 0,
                    meetUpLocation,
                    packageIncludes,
                    activities,
                    categoryId,
                    discountAmount: Number(discountAmount) || 0,
                    organizerId,
                    discounted,
                    organizerUserId: res.locals.id,
                    return: returnDate,
                },
            });
            amplitudeClient.logEvent({
                event_type: "trip_creation",
                user_id: res.locals.user.phoneNumber,
                ip: "127.0.0.1",
            });
            return res.json({
                success: true,
                data: trip,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to create trip",
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
    getTrips = async (req, res, next) => {
        const {
            organizerId,
            categoryId,
            bookedBy,
            creatorId,
            limit,
            skip,
            q,
            upcoming,
            best_deals,
        } = req.query;
        let filterLimit = Number(limit) || undefined;
        let filterSkip = Number(skip) || undefined;
        let addedOrderBy = {};
        let addedWhere = {};
        if (upcoming === "true") {
            addedOrderBy = {
                ...addedOrderBy,
                departure: "desc",
            };
            addedWhere = {
                ...addedWhere,
                departure: { gt: new Date() },
            };
        }
        if (best_deals === "true") {
            addedOrderBy = {
                ...addedOrderBy,
                discountAmount: "desc",
            };
            addedWhere = {
                ...addedWhere,
                discounted: true,
            };
        }
        try {
            const trips = await prisma.trip.findMany({
                where: {
                    organizerId: organizerId,
                    categoryId: categoryId,
                    bookedBy: bookedBy
                        ? {
                              some: {
                                  id: bookedBy,
                              },
                          }
                        : {},
                    organizerUserId: creatorId,
                    // OR: [],
                    OR: q
                        ? [
                              { name: { contains: q, mode: "insensitive" } },
                              {
                                  description: {
                                      contains: q,
                                      mode: "insensitive",
                                  },
                              },
                          ]
                        : undefined,
                    ...addedWhere,
                },
                skip: filterSkip,
                take: filterLimit,
                orderBy: {
                    ...addedOrderBy,
                },
                include: {
                    _count: true,
                    organizer: true,
                    organizer_user: true,
                    category: true,
                },
            });
            amplitudeClient.logEvent({
                event_type: "get_trips",
                user_id: res.locals.user.phoneNumber,
                ip: "127.0.0.1",
            });
            return res.json({
                success: true,
                data: trips,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error while getting trips",
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
    getWithId = async (req, res, next) => {
        try {
            const trip = await prisma.trip.findUnique({
                where: {
                    id: req.params.tripId,
                },
                include: {
                    bookedBy: true,
                    organizer: true,
                    organizer_user: true,
                    category: true,
                },
            });
            if (!trip) {
                return error("trip", "no trip found with this id", next, 404);
            }
            return res.json({
                success: true,
                data: trip,
            });
        } catch (e) {
            return error(
                "server",
                "something went wrong in retriving the community informations",
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
    updateTrip = async (req, res, next) => {
        if (!req.body.updateData) {
            return error("updateData", "please send updateData", next);
        }
        const inputFilter = {
            departure: { validate: VALIDATION_TYPE.DATE },
            return: { validate: VALIDATION_TYPE.DATE },
            name: {},
            destination: {},
            price: { validate: VALIDATION_TYPE.NUMBER },
            meetUpLocation: {},
            categoryId: {},
            description: {},
            packageIncludes: { validate: VALIDATION_TYPE.ARRAY },
            activities: { validate: VALIDATION_TYPE.ARRAY },
            discountAmount: { validate: VALIDATION_TYPE.NUMBER },
        };
        for (let i in inputFilter) {
            if (inputFilter[i].validate && req.body.updateData[i]) {
                const [{ success, message, value }] = allValidations([
                    {
                        argument: i,
                        type: inputFilter[i].validate,
                        value: req.body.updateData[i],
                    },
                ]);
                if (!success) {
                    return error(i, message, next);
                }
                req.body.updateData[i] = value;
            }
        }
        const {
            departure,
            name,
            description,
            destination,
            price,
            meetUpLocation,
            packageIncludes,
            activities,
            categoryId,
            discountAmount,
        } = req.body.updateData;
        const returnDate = req.body.return;
        try {
            if (categoryId) {
                const category = await prisma.category.findUnique({
                    where: {
                        id: categoryId,
                    },
                });
                if (!category) {
                    return error(
                        "categoryId",
                        "no category exists with this id",
                        next
                    );
                }
            }
            const discounted = discountAmount === 0;
            const trip = await prisma.trip.update({
                where: {
                    id: req.params.tripId,
                },
                data: {
                    departure,
                    name,
                    description,
                    destination,
                    price,
                    meetUpLocation,
                    packageIncludes,
                    activities,
                    categoryId,
                    discountAmount,
                    discounted: discounted ? false : undefined,
                    return: returnDate,
                },
            });
            return res.json({
                success: true,
                data: trip,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to update trip",
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
    addImages = async (req, res, next) => {
        try {
            let urls = [];
            for (let i in req.files) {
                const path = req.files[i]?.path;
                urls.push(
                    await uploadFile(path, "COMMUNITY", res.locals.id, false)
                );
            }
            const trip = await prisma.trip.update({
                where: {
                    id: req.params.tripId,
                },
                data: {
                    image: {
                        push: urls,
                    },
                },
            });
            return res.json({
                success: true,
                data: trip,
            });
        } catch (e) {
            console.log(e);
            return error("server", "upload failed please try again", next);
        }
    };
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    removeImage = async (req, res, next) => {
        try {
            const { index } = req.body;
            const trip = await prisma.trip.findUnique({
                where: {
                    id: req.params.tripId,
                },
                select: {
                    image: true,
                    id: true,
                },
            });
            let images = trip.image;
            images.splice(index, 1);
            await prisma.trip.update({
                where: { id: trip.id },
                data: {
                    image: {
                        set: images,
                    },
                },
            });
            return res.json({
                success: true,
                data: trip,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to create trip",
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
    activateTrip = async (req, res, next) => {
        try {
            await prisma.trip.update({
                where: { id: req.params.tripId },
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
    deactivateTrip = async (req, res, next) => {
        try {
            await prisma.trip.update({
                where: { id: req.params.tripId },
                data: { deletedStatus: true },
            });
            return res.json({ success: true });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
}
module.exports = new TripController();
