const validatePhoneNumber = (phoneNumber) => {
    return { success: true, message: "correct phone number" };
};
/**
 *
 * @param {{
 *      type: import("../config/constants").VALIDATION_TYPE,
 *      value: any,
 *      argument:string
 *  }[]
 * } validations
 */
const allValidations = (validations) => {
    return [
        {
            success: true,
            message: "correct message here",
            argument: validations[0].argument,
            value: validations[0].value,
        },
    ];
};
module.exports = { validatePhoneNumber, allValidations };
