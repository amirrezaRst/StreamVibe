const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userModel = require("../model/userModel");
const likeModel = require("../model/likeModel");
const bookingModel = require("../model/bookingModel");
const supportModel = require("../model/supportModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokenUtils");
const { setRefreshTokenCookie, setTokenCookie } = require("../utils/cookieUtils");
const { sendPasswordResetEmail } = require("../utils/mailer");
const { resolveMedia } = require("../utils/mediaLookup");
const { entitlementFor } = require("../utils/subscription");

//! Get Request
exports.allUser = async (req, res) => {
    try {
        const users = await userModel.find();
        res.status(200).json({ status: 200, users, message: "User list fetch successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}

exports.singleUser = async (req, res) => {
    try {
        const { refreshToken, token } = req.cookies;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id).select("-refreshToken");
            if (!user) {
                return res.status(404).json({ status: 404, message: "User not found" });
            }
            //! resolved here rather than derived on the client: this is also
            //! where a lapsed subscription gets flipped to 'expired', so the
            //! UI can never be looking at a stale 'active'
            const entitlement = await entitlementFor(user);
            return res.status(200).json({ status: 200, user, entitlement, message: "User fetch successfully" });
        }
        else if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await userModel.findById(decoded.id).select("-refreshToken");
            // .select('-password -refreshToken -watchList')
            if (!user) {
                return res.status(404).json({ status: 404, message: "User not found" });
            }
            const newTokenData = { id: user._id, email: user.email, role: user.role };

            //! Generate new access token and refresh token
            const newToken = generateAccessToken(newTokenData);
            const newRefreshToken = generateRefreshToken(newTokenData);

            user.refreshToken = newRefreshToken; //! Save refresh token to user database
            setTokenCookie(res, newToken);
            setRefreshTokenCookie(res, newRefreshToken);

            await user.save();
            // console.log(refreshToken)
            user.refreshToken = undefined;
            const entitlement = await entitlementFor(user);
            return res.status(200).json({ status: 200, user, entitlement, message: "User fetch successfully" });
        }

        else {
            return res.status(401).json({ status: 401, message: "Unauthorized" });
        }
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getWatchList = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('watchList');
        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        //! newest first, which is what the profile grid shows
        const ids = [...user.watchList].reverse().map(entry => entry.item);
        const watchList = await resolveMedia(ids);

        res.status(200).json({ status: 200, total: watchList.length, watchList, message: "Watchlist fetched" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! Profile overview — one request feeds both the sidebar badges and the
//! account summary card, so opening the profile doesn't fan out into five
exports.getOverview = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    try {
        const [user, likes, bookings, upcoming, tickets, openTickets] = await Promise.all([
            userModel.findById(userId).select('fullName email subscription watchList'),
            likeModel.countDocuments({ userId }),
            bookingModel.countDocuments({ user: userId, status: { $ne: 'expired' } }),
            countUpcomingBookings(userId),
            supportModel.countDocuments({ user: userId }),
            supportModel.countDocuments({ user: userId, status: { $ne: 'resolved' } }),
        ]);

        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        res.status(200).json({
            status: 200,
            message: "Overview fetched successfully",
            overview: {
                //! the account has no createdAt column, but the ObjectId already
                //! carries the second it was minted
                memberSince: user._id.getTimestamp(),
                subscription: user.subscription,
                counts: {
                    watchList: user.watchList.length,
                    likes,
                    bookings,
                    upcomingBookings: upcoming,
                    tickets,
                    openTickets,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

//! "upcoming" is a property of the screening, not the booking, so this has to
//! reach across into showtimes to answer it
const countUpcomingBookings = async (userId) => {
    const [result] = await bookingModel.aggregate([
        { $match: { user: userId, status: 'confirmed' } },
        {
            $lookup: {
                from: 'showtimes',
                localField: 'showtime',
                foreignField: '_id',
                as: 'showtime',
            },
        },
        { $unwind: '$showtime' },
        { $match: { 'showtime.startsAt': { $gt: new Date() } } },
        { $count: 'total' },
    ]);

    return result ? result.total : 0;
};



//! Post Request
exports.registerUser = async (req, res) => {
    const { fullName, email, password, remember } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (user) {
            return res.status(409).json({ status: 409, message: "User already exists" });
        }

        const newUser = new userModel({
            fullName,
            email,
            password
        });

        const tokenData = {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
        }

        const token = generateAccessToken(tokenData);

        let refreshToken;
        if (remember) {
            refreshToken = generateRefreshToken(tokenData);
            newUser.refreshToken = refreshToken; //! must be set before save() or it never gets persisted
        }

        await newUser.save();

        if (remember) {
            setRefreshTokenCookie(res, refreshToken);
        }
        setTokenCookie(res, token);

        const safeUser = newUser.toObject();
        delete safeUser.password;
        delete safeUser.refreshToken;

        res.status(201).json({ status: 201, message: "User created", user: safeUser });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//? Login
exports.login = async (req, res) => {
    const { email, password, remember } = req.body;
    try {
        const user = await userModel.findOne({ email })
            .select("email password role refreshToken");

        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 401, message: "Invalid Credentials" });
        }

        const tokenData = {
            id: user._id,
            email: user.email,
            role: user.role,
        }

        const token = generateAccessToken(tokenData);
        const refreshToken = generateRefreshToken(tokenData);

        user.refreshToken = refreshToken; //! Save refresh token to user database
        await user.save();

        if (remember) {
            setRefreshTokenCookie(res, refreshToken);
        }

        setTokenCookie(res, token);

        // Set HTTP Only cookie for token (access token)
        res.status(200).json({ status: 200, message: "Login Successfully" });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies
    if (!refreshToken) return res.status(401).json({ status: 401, message: "No refresh token provided" });

    try {
        //! Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await userModel.findById(decoded.id)
            .select("email role refreshToken");

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ status: 403, message: "Invalid refresh token" });
        }

        //! Generate a new access token
        const newTokenData = { id: user._id, email: user.email, role: user.role };
        const newToken = generateAccessToken(newTokenData);

        //! Optionally generate a new refresh token
        const newRefreshToken = generateRefreshToken(newTokenData);
        user.refreshToken = newRefreshToken; // Update the refresh token in the database
        await user.save();

        // Set HTTP Only cookie for token (access token)
        setTokenCookie(res, newToken);
        setRefreshTokenCookie(res, newRefreshToken);

        res.status(200).json({ status: 200, message: "Tokens refreshed successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.logout = (req, res) => {
    try {
        res.cookie('token', '', { httpOnly: true, sameSite: 'strict', expires: new Date(0) });
        //! path must match the one used in setRefreshTokenCookie, or the browser won't clear it
        res.cookie('refreshToken', '', { httpOnly: true, sameSite: 'strict', expires: new Date(0), path: '/api/user/refreshToken' });

        res.status(200).json({ status: 200, message: "Logout Successfully" });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//? Password Reset
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');

            user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
            user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
            await user.save();

            const resetUrl = `${process.env.FRONT_ADDRESS.replace(/\/$/, '')}/forgot-password/reset/${rawToken}`;
            await sendPasswordResetEmail(user.email, resetUrl);
        }

        //! same response whether or not the email exists, so this can't be used to enumerate accounts
        res.status(200).json({ status: 200, message: "If that email is registered, a reset link has been sent." });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ status: 400, message: "This reset link is invalid or has expired." });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ status: 200, message: "Password has been reset successfully." });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//? Profile
exports.updateProfile = async (req, res) => {
    const { fullName, email } = req.body;

    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        if (email && email !== user.email) {
            const taken = await userModel.exists({ email, _id: { $ne: user._id } });
            if (taken) {
                return res.status(409).json({ status: 409, message: "That email is already in use" });
            }
            user.email = email;
        }
        if (fullName) user.fullName = fullName;

        await user.save();

        //! the access token carries the email in its payload, so a changed
        //! address has to be re-signed or the session keeps quoting the old one
        setTokenCookie(res, generateAccessToken({ id: user._id, email: user.email, role: user.role }));

        const safeUser = user.toObject();
        delete safeUser.password;
        delete safeUser.refreshToken;

        res.status(200).json({ status: 200, message: "Profile updated successfully", user: safeUser });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await userModel.findById(req.user.id).select("email role password refreshToken");
        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        const isMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 401, message: "Your current password is incorrect" });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ status: 400, message: "Your new password must be different from the current one" });
        }

        user.password = newPassword;

        const tokenData = { id: user._id, email: user.email, role: user.role };

        //! a password change should end sessions on other devices — rotating the
        //! stored refresh token is what invalidates the ones they're holding.
        //! Only rotate if this session actually has one, so changing a password
        //! doesn't silently upgrade a "don't remember me" login.
        if (req.cookies.refreshToken) {
            const refreshToken = generateRefreshToken(tokenData);
            user.refreshToken = refreshToken;
            setRefreshTokenCookie(res, refreshToken);
        } else {
            user.refreshToken = undefined;
        }

        await user.save();
        setTokenCookie(res, generateAccessToken(tokenData));

        res.status(200).json({ status: 200, message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//? Watchlist
exports.addToWatchList = async (req, res) => {
    const { kind, item } = req.body;

    try {
        //! $ne on the sub-document makes this idempotent under a double click:
        //! the second write matches nothing instead of duplicating the entry
        const result = await userModel.updateOne(
            { _id: req.user.id, 'watchList.item': { $ne: item } },
            { $push: { watchList: { kind, item } } }
        );

        if (!result.matchedCount) {
            return res.status(200).json({ status: 200, message: "Already in your watchlist", added: false });
        }

        res.status(201).json({ status: 201, message: "Added to your watchlist", added: true });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.removeFromWatchList = async (req, res) => {
    try {
        const result = await userModel.updateOne(
            { _id: req.user.id },
            { $pull: { watchList: { item: req.params.itemId } } }
        );

        if (!result.modifiedCount) {
            return res.status(404).json({ status: 404, message: "That title isn't in your watchlist" });
        }

        res.status(200).json({ status: 200, message: "Removed from your watchlist" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

exports.watchListStatus = async (req, res) => {
    try {
        const saved = await userModel.exists({ _id: req.user.id, 'watchList.item': req.params.itemId });
        res.status(200).json({ status: 200, saved: !!saved });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Delete Request
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await userModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        res.status(200).json({ status: 200, message: "User deleted" });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
}




//? Subscription Controller
exports.addSubscription = async (req, res) => {
    const userId = req.params.id;

    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ status: 403, message: "You can only manage your own subscription" });
    }

    try {
        const { plan, time, freeTrial } = req.body;

        const startDate = new Date();
        if (freeTrial) {
            //! the UI hides the button once the trial is spent, but that is not
            //! a control — without this check the same account could re-claim
            //! the 7 free days indefinitely by calling the endpoint directly
            const existing = await userModel.findById(userId).select('timeTrial');
            if (!existing) {
                return res.status(404).json({ status: 404, message: "User not found" });
            }
            if (existing.timeTrial) {
                return res.status(409).json({ status: 409, message: "The free trial has already been used on this account" });
            }

            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 7);  // for a 7 day trial

            const user = await userModel.findByIdAndUpdate(userId, {
                subscription: {
                    status: 'active',
                    startDate,
                    endDate,
                    plan: 'premium',
                },
                timeTrial: true
            });
            if (!user) {
                return res.status(404).json({ status: 404, message: "User not found" });
            }
            return res.status(200).json({ status: 200, message: "Free Trial activated" });
        }
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + time);
        const user = await userModel.findByIdAndUpdate(userId, {
            subscription: {
                status: 'active',
                startDate,
                endDate,
                plan,
            },
        });

        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        res.status(200).json({ status: 200, message: "Subscription activated" });
    }
    catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};