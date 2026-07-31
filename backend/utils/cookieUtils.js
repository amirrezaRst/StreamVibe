const setCookie = (res, name, value, options) => {
    res.cookie(name, value, options);
};

const createCommonCookieOptions = (maxAge, path = '/') => ({
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAge,
    path: path
});

const setRefreshTokenCookie = (res, refreshToken) => {
    const options = createCommonCookieOptions(86400000 * 30, '/api/user/refreshToken'); // 30 days
    setCookie(res, 'refreshToken', refreshToken, options);
};

const setTokenCookie = (res, token) => {
    setCookie(res, 'token', token, createCommonCookieOptions(86400000));
};

module.exports = {
    setRefreshTokenCookie,
    setTokenCookie
};
