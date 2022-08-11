const express = require("express");
const { json } = require("body-parser");
const path = require("path");
require("dotenv").config();
const app = express();
const cors = require("cors");
const { makeEnvExample } = require("./utils");
app.use(cors());
app.use(json());

const allRoutes = require("./routes");
/**all routes are declared here */
app.use("/api", allRoutes);

/**error handling middleware(all errors go through here, when the router handlers call next with an error) */
app.use((err, _req, res, _next) => {
    let myError = JSON.parse(err.message);
    const status = myError.status;
    delete myError.status;
    res.status(status).send({ error: myError });
});

const port = 4000;
//create .env.example
if (process.env.NODE_ENV === "development") {
    makeEnvExample();
}
module.exports = app.listen(port, () => {
    console.log(`App listening on port ${port}!`);
});
