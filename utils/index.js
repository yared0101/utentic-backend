const fs = require("fs");

/**
 *
 * @param {string} key argument of the error
 * @param {string|Array<string>} message error message to send client
 * @param {Function} next the next middleware function of express
 * @param {number} status status of the error(default 400)
 */
const error = (key, message, next, status = 400) => {
    let myError = { status, message, argument: key };
    status != 400 && console.log({ error: myError });
    next(new Error(JSON.stringify(myError)));
    return false;
};
const makeEnvExample = () => {
    let writtenEnv = fs.readFileSync(".env", "utf8");
    writtenEnv = writtenEnv.replace(/=.*/g, "=your_value_here");
    // for (let i in process.env) {
    //     writtenEnv += `${i}=your_value_here\n`;
    // }
    fs.writeFileSync(".env.example", writtenEnv);
    console.log("env file written");
};
module.exports = { error, makeEnvExample };
