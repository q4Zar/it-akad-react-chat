'use strict';
const fs = require("fs");
const path = require("path");
const { pages, global, leadFormSubmissions } = require("../../data/data.json");

const {
    findUser, 
    createUser,
    userExists,
    getUsersInRoom,
    deleteUser
} = require('./utils/database');

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: "type",
    name: "setup",
  });
  const initHasRun = await pluginStore.get({ key: "initHasRun" });
  await pluginStore.set({ key: "initHasRun", value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi
    .query("role", "users-permissions")
    .findOne({ type: "public" });

  // List all available permissions
  const publicPermissions = await strapi
    .query("permission", "users-permissions")
    .find({ type: "application", role: publicRole.id });

  // Update permission to match new config
  const controllersToUpdate = Object.keys(newPermissions);
  const updatePromises = publicPermissions
    .filter((permission) => {
      // Only update permissions included in newConfig
      if (!controllersToUpdate.includes(permission.controller)) {
        return false;
      }
      if (!newPermissions[permission.controller].includes(permission.action)) {
        return false;
      }
      return true;
    })
    .map((permission) => {
      // Enable the selected permissions
      return strapi
        .query("permission", "users-permissions")
        .update({ id: permission.id }, { enabled: true });
    });
  await Promise.all(updatePromises);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats["size"];
  return fileSizeInBytes;
}

function getFileData(fileName) {
  const filePath = `./data/uploads/${fileName}`;

  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split(".").pop();
  const mimeType = `image/${ext === "svg" ? "svg+xml" : ext}`;

  return {
    path: filePath,
    name: fileName,
    size,
    type: mimeType,
  };
}

// Create an entry and attach files if there are any
async function createEntry(model, entry, files) {
  try {
    const createdEntry = await strapi.query(model).create(entry);
    if (files) {
      await strapi.entityService.uploadFiles(createdEntry, files, {
        model,
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function importPages() {
  const getPageCover = (slug) => {
    switch (slug) {
      case "":
        return getFileData("undraw-content-team.png");
      default:
        return null;
    }
  };

  return pages.map(async (page) => {
    const files = {};
    const shareImage = getPageCover(page.slug);
    if (shareImage) {
      files["metadata.shareImage"] = shareImage;
    }
    // Check if dynamic zone has attached files
    page.contentSections.forEach((section, index) => {
      if (section.__component === "sections.hero") {
        files[`contentSections.${index}.picture`] = getFileData(
          "undraw-content-team.svg"
        );
      } else if (section.__component === "sections.feature-rows-group") {
        const getFeatureMedia = (featureIndex) => {
          switch (featureIndex) {
            case 0:
              return getFileData("undraw-design-page.svg");
            case 1:
              return getFileData("undraw-create-page.svg");
            default:
              return null;
          }
        };
        section.features.forEach((feature, featureIndex) => {
          files[
            `contentSections.${index}.features.${featureIndex}.media`
          ] = getFeatureMedia(featureIndex);
        });
      } else if (section.__component === "sections.feature-columns-group") {
        const getFeatureMedia = (featureIndex) => {
          switch (featureIndex) {
            case 0:
              return getFileData("preview.svg");
            case 1:
              return getFileData("devices.svg");
            case 2:
              return getFileData("palette.svg");
            default:
              return null;
          }
        };
        section.features.forEach((feature, featureIndex) => {
          files[
            `contentSections.${index}.features.${featureIndex}.icon`
          ] = getFeatureMedia(featureIndex);
        });
      } else if (section.__component === "sections.testimonials-group") {
        section.logos.forEach((logo, logoIndex) => {
          files[
            `contentSections.${index}.logos.${logoIndex}.logo`
          ] = getFileData("logo.png");
        });
        section.testimonials.forEach((testimonial, testimonialIndex) => {
          files[
            `contentSections.${index}.testimonials.${testimonialIndex}.logo`
          ] = getFileData("logo.png");
          files[
            `contentSections.${index}.testimonials.${testimonialIndex}.picture`
          ] = getFileData("user.png");
        });
      }
    });
    await createEntry("page", page, files);
  });
}

async function importGlobal() {
  // Add images
  const files = {
    favicon: getFileData("favicon.png"),
    "metadata.shareImage": getFileData("undraw-content-team.png"),
    "navbar.logo": getFileData("logo.png"),
    "footer.logo": getFileData("logo.png"),
  };
  // Create entry
  await createEntry("global", global, files);
}

async function importLeadFormSubmissionData() {
  leadFormSubmissions.forEach(async (submission) => {
    await createEntry("lead-form-submissions", submission);
  });
}

async function importSeedData() {
  // Allow read of application content types
  await setPublicPermissions({
    global: ["find"],
    page: ["find", "findone"],
  });

  // Create all entries
  await importGlobal();
  await importPages();
  await importLeadFormSubmissionData();
}

module.exports = async () => {
  const shouldImportSeedData = await isFirstRun();
  if (shouldImportSeedData) {
    try {
      await importSeedData();
    } catch (error) {
      console.log("Could not import seed data");
      console.error(error);
    }
  }

  var io = require('socket.io')(strapi.server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

  io.on('connection', function(socket) {
    console.log('connection')
    socket.on('join', async({ username, room }, callback) => {
        console.log('join', socket.id)
        try {
            const userExists = await findUser(username, room);
            console.log(userExists)
            if(userExists.length > 0) {
                console.log('userExists.length > 0')
                callback(`User ${username} already exists in room no${room}. Please select a different name or room`);
            } else {
                console.log('createUser')
                const user = await createUser({
                    username: username,
                    room: room,
                    status: "ONLINE",
                    socketid: socket.id
                });
                console.log(user)
                if(user) {
                    socket.join(user.room);
                    socket.emit('welcome', {
                        user: 'bot',
                        text: `${user.username}, Welcome to room ${user.room}.`,
                        userData: user
                    }); 
                    socket.broadcast.to(user.room).emit('message', {
                        user: 'bot',
                        text: `${user.username} has joined`,
                    });
                    io.to(user.room).emit('roomInfo', {
                      room: user.room,
                      users: await getUsersInRoom(user.room)
                    });
                } else {
                    console.log('user could not be created. Try again!')
                    callback(`user could not be created. Try again!`)
                }
            }
            callback();
        } catch(err) {
            console.log("Err occured, Try again!", err);
        }
    })
    socket.on('sendMessage', async(data, callback) => {
      try {
          console.log(data)
          const user = await userExists(data.userId );
          if(user) {
              io.to(user.room).emit('message', {
                  user: user.username,
                  text: data.message,
              });
          } else {
              callback(`User doesn't exist in the database. Rejoin the chat`)
          }
          callback();
      } catch(err) {
          console.log("err inside catch block", err);
      }
    });
    socket.on('disconnect', async(data) => {
      console.log(data)
      try {
          console.log("DISCONNECTED!!!!!!!!!!!!");
          const user = await deleteUser( data);
          console.log("deleted user is", user)
          if(user.length > 0) {
              io.to(user[0].room).emit('message', {
                  user: user[0].username,
                  text: `User ${user[0].username} has left the chat.`,
              });  
              io.to(user.room).emit('roomInfo', {
                  room: user.room,
                  users: await getUsersInRoom(user[0].room)
              });
          }
      } catch(err) {
          console.log("error while disconnecting", err);
      }
    });
  });
};
