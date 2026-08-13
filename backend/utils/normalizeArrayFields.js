/**
 * multer collapses a repeated multipart field to a bare value when exactly
 * one was sent, and only to an array once there are two or more — confirmed
 * empirically, not documented. A form where an admin can genuinely pick just
 * one genre or one cast member would otherwise fail `joi.array()` only in
 * that specific case, which is the kind of bug that hides until someone hits
 * it by accident.
 */
const normalizeArrayFields = (body, fields) => {
    fields.forEach((field) => {
        if (body[field] !== undefined && !Array.isArray(body[field])) {
            body[field] = [body[field]];
        }
    });
};

module.exports = normalizeArrayFields;
