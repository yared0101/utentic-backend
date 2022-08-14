const { cloudinary } = require("../config");

/**
 *
 * @param {string} filePath path of file given by multer
 * @param {"USER"|"COMMUNITY"|"TRIP"} type type of uploaded file
 * @param {string} id id of type for file saving
 */
const uploadFile = async (filePath, type, id, isBanner = false) => {
    if (!filePath) {
        return "";
    }
    const file = `${isBanner ? "BANNER_" : "PROFILE_"}${id}`;
    const uploadedFile = await cloudinary.uploader.upload(filePath, {
        folder: type,
        use_filename: false,
        // use_filename:`${isBanner? "BANNER_":"PROFILE_"}${id}`,
    });
    return uploadedFile.secure_url;
};
module.exports = { uploadFile };
