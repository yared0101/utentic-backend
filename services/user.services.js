const { prisma } = require("../config");
// const { VALIDATION_TYPE } = require("../config/constants");
const { error } = require("../utils");
// const { validatePhoneNumber, allValidations } = require("../utils/validation");

class UserServices {
    updateUser = async (updatedUserId, bodyUpdateData, next) => {
        const { username, firstName, lastName, email, bio } = bodyUpdateData;
        const updateData = { username, firstName, lastName, email, bio };
        if (!Object.keys(updateData).length) {
            return error("updateData", "please send updateData", next);
        }
        const previousUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: { equals: username, mode: "insensitive" } },
                    { email: { equals: username, mode: "insensitive" } },
                ],
            },
        });
        if (previousUser && previousUser.id !== updatedUserId) {
            const arg =
                previousUser.username === username ? "username" : "email";
            return error(arg, `user with the same ${arg} already exists`, next);
        }
        try {
            const updatedUser = await prisma.user.update({
                where: {
                    id: updatedUserId,
                },
                data: updateData,
            });
            return { success: true, updateData: updatedUser };
        } catch (e) {
            console.log(e);
            return error(
                "server",
                "something went wrong updating user, try again later",
                next,
                500
            );
        }
    };
    getOneUser = async (id, next) => {
        try {
            if (!id) {
                return error("user", "please send id", next, 404);
            }
            const user = await prisma.user.findUnique({
                where: {
                    id: id,
                },
                include: {
                    bookedTrips: true,
                    createdCommunities: true,
                    followedCommunities: true,
                    managedCommunities: true,
                    organizedTrips: true,
                },
            });
            if (!user) {
                return error("user", "no user found with this id", next, 404);
            }
            return {
                success: true,
                data: user,
            };
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
}
module.exports = new UserServices();
