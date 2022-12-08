const { faker } = require("@faker-js/faker");
const { hash } = require("bcrypt");
const { prisma } = require("../config");
const addUsers = async () => {
    const password = await hash("password", 10);
    //create admin
    await prisma.user.create({
        data: {
            firstName: "admin",
            lastName: "admin",
            password,
            phoneNumber: "0912345678",
            banner: faker.image.imageUrl(),
            bio: "I am admin",
            email: `${faker.random.word()}${faker.random.word()}@admin.com`,
            isAdmin: true,
            profile: faker.internet.avatar(),
            username: "admin",
        },
    });
    //create normal users
    await prisma.user.createMany({
        data: Array(20)
            .fill(2)
            .map(() => ({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                password,
                phoneNumber: faker.phone.number(),
                banner: faker.image.imageUrl(),
                bio: faker.random.words(7),
                email: `${faker.random.word()}${faker.random.word()}@faker.com`,
                isAdmin: false,
                profile: faker.image.imageUrl(),
                username: faker.company.name(),
            })),
        skipDuplicates: true,
    });
};
const addCommunities = async () => {
    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.community.createMany({
        skipDuplicates: true,
        data: Array(10)
            .fill(2)
            .map(() => ({
                creatorId: users[parseInt(Math.random() * 10)].id,
                banner: faker.image.imageUrl(),
                bio: faker.random.words(7),
                communityUsername: faker.company.bsNoun(),
                contactNumber: faker.phone.number(),
                profile: faker.internet.avatar(),
                name: faker.animal.bird(),
            })),
    });
};

const addCategories = async () => {
    await prisma.category.createMany({
        data: Array(4)
            .fill(2)
            .map(() => ({
                name: faker.random.word(),
                description: faker.lorem.sentence(),
            })),
    });
};

const addTrips = async () => {
    const categories = await prisma.category.findMany();
    const communities = await prisma.community.findMany({
        select: {
            id: true,
            creatorId: true,
        },
    });
    console.log(communities);
    await prisma.trip.createMany({
        skipDuplicates: true,
        data: Array(20)
            .fill(2)
            .map((_, index) => {
                const chosenCommunity =
                    communities[parseInt(Math.random() * 4)];
                return {
                    categoryId: categories[parseInt(Math.random() * 4)].id,
                    departure: faker.date.birthdate(),
                    destination: faker.address.city(),
                    discountAmount:
                        index % 2 === 0
                            ? parseFloat(faker.random.numeric(2))
                            : null,
                    discounted: index % 2 === 0,
                    meetUpLocation: faker.address.city(),
                    name: faker.company.name(),
                    organizerId: chosenCommunity.id,
                    organizerUserId: chosenCommunity.creatorId,
                    return: faker.date.birthdate(),
                    activities: faker.helpers.arrayElements(
                        Array(10)
                            .fill(2)
                            .map(() => faker.random.word())
                    ),
                    description: faker.lorem.sentence(),
                    image: faker.helpers.arrayElements(
                        Array(10)
                            .fill(2)
                            .map(() => faker.image.imageUrl())
                    ),
                    packageIncludes: faker.helpers.arrayElements(
                        Array(10)
                            .fill(2)
                            .map(() => faker.random.word())
                    ),
                    price: parseFloat(faker.random.numeric(3)),
                };
            }),
    });
};
const main = async () => {
    // console.log("await addCategories()");
    // await addCategories();
    // console.log("await addUsers()");
    // await addUsers();
    // console.log("await addCommunities()");
    // await addCommunities();
    console.log("await addTrips()");
    await addTrips();
};
main()
    .catch((e) => console.log(e))
    .then(() => console.log("done"));
