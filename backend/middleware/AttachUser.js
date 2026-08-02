const jwt = require('jsonwebtoken');

//! Optional authentication, for endpoints that anyone may call but that behave
//! better when they know who is calling — the contact form works logged out,
//! yet a ticket sent by a signed-in user should end up in their profile.
//! A missing or stale token is not an error here; it just means anonymous.
module.exports = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return next();

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        //! ignored on purpose — see above
    }

    next();
};
