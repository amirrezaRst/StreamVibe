const { isValidObjectId } = require("mongoose");

const validateParam = (paramName) => (req, res, next) => {
    if (!isValidObjectId(req.params[paramName])) {
        return res.status(400).json({ status: 400, message: "Invalid ID" });
    }
    next();
};

//! default export stays drop-in middleware checking :id;
//! ValidateObjectId.param('movieId') covers routes that name the param differently
const ValidateObjectId = validateParam('id');
ValidateObjectId.param = validateParam;

module.exports = ValidateObjectId;
