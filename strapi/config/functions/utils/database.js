async function findUser(username, room) {
    try {
        console.log(username, room)
        // console.log(strapi)
        const userExists = await strapi.services.chat.find({ username, room });
        return userExists;
    } catch(err) {
        console.log("error while fetching", err);
    }
}
async function createUser({ username, room, status, socketid }) {
    try {
        const user = await strapi.services.chat.create({
            username,
            room,
            status: status,
            socketid
        });
        return user;
    } catch(err) {
        console.log("User couldn't be created. Try again!")
    }
}

async function userExists(userId) {
    try {
        const user = await strapi.services.chat.findOne({ id: userId });
        return user;
    } catch(err) {
        console.log("Error occured when fetching user", err);
    }
}

async function getUsersInRoom(room) {
    try {
        const usersInRoom = await strapi.services.chat.find({ room })
        return usersInRoom;
    } catch(err) {
        console.log("Error.Try again!", err);
    }
}

async function deleteUser(socketId) {
    try {
        console.log(`deleting socketid : ${socketId}`)
        const user = await strapi.services.chat.delete({ socketid: socketId });
        console.log(user)
        return user;
    } catch(err) {
        console.log("Error while deleting the User", err);
    }
}

module.exports = {
    findUser,
    createUser,
    userExists,
    getUsersInRoom,
    deleteUser
}