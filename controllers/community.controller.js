const { prisma } = require("../config");
const { VALIDATION_TYPE } = require("../config/constants");
const { error } = require("../utils");
const { uploadFile } = require("../utils/upload");
const { allValidations } = require("../utils/validation");

class CommunityController {
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     * @returns
     */
    newCommunity = async (req, res, next) => {
        const {
            name,
            communityUsername,
            bio,
            contactNumber,
            bankNames,
            bankAccounts,
        } = req.body;
        const inputBankNames = bankNames?.filter((elem) => elem);
        const inputBankNumbers = bankAccounts?.filter((elem) => elem);
        const minIndex =
            Math.min(inputBankNames?.length, inputBankNumbers?.length) || 0;
        let inputBanks = [];
        for (let i = 0; i < minIndex; i++) {
            inputBanks.push({
                name: inputBankNames[i],
                number: inputBankNumbers[i],
            });
        }
        if (!name) {
            return error("name", "please send name of your community", next);
        }
        if (communityUsername) {
            const [{ success, message, argument }] = allValidations([
                {
                    type: VALIDATION_TYPE.COMMUNITY_USERNAME,
                    value: communityUsername,
                    argument: VALIDATION_TYPE.COMMUNITY_USERNAME,
                },
            ]);
            if (!success) {
                return error(argument, message, next);
            }
            const prevCom = await prisma.community.findFirst({
                where: {
                    communityUsername: {
                        equals: communityUsername,
                        mode: "insensitive",
                    },
                },
            });
            if (prevCom) {
                return error(argument, "username already exists", next, 409);
            }
        }
        let profile = "",
            banner = "";
        try {
            const profilePath = req.files?.profile[0]?.path;
            const bannerPath = req.files?.banner[0]?.path;
            profile = await uploadFile(
                profilePath,
                "COMMUNITY",
                res.locals.id,
                false
            );
            banner = await uploadFile(
                bannerPath,
                "COMMUNITY",
                res.locals.id,
                true
            );
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error when trying to upload files, try again",
                next
            );
        }
        try {
            const created = await prisma.community.create({
                data: {
                    name,
                    communityUsername,
                    bio,
                    profile,
                    banner,
                    contactNumber,
                    creatorId: res.locals.id,
                    bankAccounts: {
                        createMany: {
                            data: inputBanks || [],
                            skipDuplicates: true,
                        },
                    },
                },
                include: {
                    bankAccounts: true,
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
                "internal server error when trying to create community",
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
    getCommunities = async (req, res, next) => {
        const {
            creatorId,
            managerId,
            tripId,
            followerId,
            limit,
            skip,
            q,
            popular,
        } = req.query;
        let filterLimit = Number(limit) || undefined;
        let filterSkip = Number(skip) || undefined;
        let addedFiltersOrderBy = {};
        if (popular === "true") {
            addedFiltersOrderBy = {
                ...addedFiltersOrderBy,
                followers: { _count: "desc" },
            };
        }
        try {
            const communities = await prisma.community.findMany({
                where: {
                    creatorId: creatorId,
                    managers: managerId
                        ? {
                              some: {
                                  id: managerId,
                              },
                          }
                        : undefined,
                    organizedTrips: tripId
                        ? {
                              some: {
                                  id: tripId,
                              },
                          }
                        : undefined,
                    followers: followerId
                        ? {
                              some: {
                                  id: followerId,
                              },
                          }
                        : undefined,
                    OR: q
                        ? [
                              { name: { contains: q, mode: "insensitive" } },
                              {
                                  communityUsername: {
                                      contains: q,
                                      mode: "insensitive",
                                  },
                              },
                              { bio: { contains: q, mode: "insensitive" } },
                          ]
                        : undefined,
                },
                skip: filterSkip,
                take: filterLimit,
                orderBy: {
                    ...addedFiltersOrderBy,
                },
                include: {
                    _count: true,
                    bankAccounts: true,
                    creator: true,
                    followers: { take: 3 },
                },
            });
            return res.json({
                success: true,
                data: communities,
            });
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "internal server error while getting communities",
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
            const community = await prisma.community.findUnique({
                where: {
                    id: req.params.communityId,
                },
                include: {
                    bankAccounts: true,
                    creator: true,
                    managers: true,
                    followers: true,
                    organizedTrips: true,
                },
            });
            if (!community) {
                return error(
                    "community",
                    "no community found with this id",
                    next,
                    404
                );
            }
            return res.json({
                success: true,
                data: community,
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
    updateCommunity = async (req, res, next) => {
        if (!req.body.updateData) {
            return error("updateData", "please send updateData", next);
        }
        const { name, communityUsername, bio, contactNumber, banks } =
            req.body.updateData;
        const inputBanks = banks
            ?.filter((elem) => elem.name && elem.number)
            ?.map((elem) => ({ name: elem.name, number: elem.number }));
        const communityBeforeUpdate = await prisma.community.findUnique({
            where: {
                id: req.params.communityId,
            },
        });
        if (!communityBeforeUpdate) {
            return error(
                "community",
                "no commmunity exists with this id",
                next,
                404
            );
        }
        if (communityUsername) {
            const [{ success, message, argument }] = allValidations([
                {
                    type: VALIDATION_TYPE.COMMUNITY_USERNAME,
                    value: communityUsername,
                    argument: VALIDATION_TYPE.COMMUNITY_USERNAME,
                },
            ]);
            if (!success) {
                return error(argument, message, next);
            }
            const prevCom = await prisma.community.findFirst({
                where: {
                    communityUsername: {
                        equals: communityUsername,
                        mode: "insensitive",
                    },
                },
            });
            if (prevCom && prevCom.id !== communityBeforeUpdate.id) {
                return error(argument, "username already exists", next, 409);
            }
        }
        try {
            const created = await prisma.community.update({
                where: {
                    id: communityBeforeUpdate.id,
                },
                data: {
                    name,
                    communityUsername,
                    bio,
                    contactNumber,
                    bankAccounts: inputBanks
                        ? {
                              deleteMany: {},
                              createMany: {
                                  data: inputBanks || [],
                                  skipDuplicates: true,
                              },
                          }
                        : {},
                },
                include: {
                    bankAccounts: true,
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
                "internal server error when trying to update community",
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
                "COMMUNITY",
                res.locals.id,
                false
            );
            const community = await prisma.community.update({
                where: { id: req.params.communityId },
                data: { profile },
            });
            return res.json({
                success: true,
                data: community,
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
                "COMMUNITY",
                res.locals.id,
                true
            );
            const community = await prisma.community.update({
                where: { id: req.params.communityId },
                data: { banner },
            });
            return res.json({
                success: true,
                data: community,
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
    activateCommunity = async (req, res, next) => {
        try {
            await prisma.community.update({
                where: { id: req.params.communityId },
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
    deactivateCommunity = async (req, res, next) => {
        try {
            await prisma.community.update({
                where: { id: req.params.communityId },
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
    addManagers = async (req, res, next) => {
        const { managers } = req.body;
        if (!Array.isArray(managers)) {
            return error(
                "managers",
                "please send managers as an array of selected users to manage",
                next
            );
        }
        console.log(managers, managers.length, !managers.length);
        if (!managers.length) {
            return error(
                "managers",
                "send at least 1 user to be manager",
                next
            );
        }
        try {
            const selectedManagers = await prisma.user.findMany({
                where: {
                    OR: managers.map((elem) => ({ id: elem })),
                    followedCommunities: {
                        some: { id: req.params.communityId },
                    },
                },
            });
            if (!selectedManagers.length) {
                return error(
                    "managers",
                    "send at least 1 user to be manager, and must be a follower of the community",
                    next
                );
            }
            await prisma.community.update({
                where: { id: req.params.communityId },
                data: {
                    managers: {
                        connect: selectedManagers.map((elem) => ({
                            id: elem.id,
                        })),
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
    removeManagers = async (req, res, next) => {
        const { managers } = req.body;
        if (!Array.isArray(managers)) {
            return error(
                "managers",
                "please send managers as an array of selected users to manage",
                next
            );
        }
        if (!managers.length) {
            return error(
                "managers",
                "send at least 1 user to be manager",
                next
            );
        }
        try {
            const selectedManagers = await prisma.user.findMany({
                where: {
                    OR: managers.map((elem) => ({ id: elem })),
                    managedCommunities: {
                        some: { id: req.params.communityId },
                    },
                },
            });
            if (!selectedManagers.length) {
                return error(
                    "managers",
                    "select at least 1 manager to be removed, user must be a manager of the community",
                    next
                );
            }
            const community = await prisma.community.update({
                where: { id: req.params.communityId },
                data: {
                    managers: {
                        disconnect: selectedManagers.map((elem) => ({
                            id: elem.id,
                        })),
                    },
                },
            });
            return res.json({
                success: true,
                data: community,
            });
        } catch (e) {
            return error("server", "something went wrong", next, 500);
        }
    };
}
module.exports = new CommunityController();
