require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const from = process.env.FROM_PHONE;
const sendVerificationSms = async (to, code) => {
    try {
        await client.messages.create({
            body: `this is your utentic verification code - ${code}`,
            from,
            to,
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};
module.exports = { sendVerificationSms };
