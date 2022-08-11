/**
 * just cleans up keys not inside the keys in body
 * DISCLAIMER this middleware doesn't check types
 * @param {{[string]:string}} keysInBody keys you want filtered into the req.body(nested objects allowed)
 */
const inputCleanUp = (keysInBody) => async (req, res, next) => {
    req.body = cleanUpObject(keysInBody, req.body);
    next();
};
const cleanUpObject = (object, cleanedUpData) => {
    let newSet = {};
    for (let i in object) {
        if (typeof object[i] !== "object") {
            if (typeof cleanedUpData[i] === "object") {
                //skip
            } else {
                newSet[i] = cleanedUpData[i];
            }
        } else {
            if (typeof cleanedUpData[i] === "object") {
                newSet[i] = cleanUpObject(object[i], cleanedUpData[i]);
            }
        }
    }
    return newSet;
};
module.exports = { inputCleanUp };
