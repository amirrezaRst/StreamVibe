const express = require('express');
const dotEnv = require('dotenv');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const connectDb = require('./config/db');

//! Config Env
dotEnv.config({ path: './config/config.env' });


//! Connect to Database
connectDb();

//! cors options
const corsOptions = {
    origin: ["http://localhost:3000", "https://streamvibe-live.liara.run"],
    credentials: true,
};

const app = express().use(express.json())
    .use(helmet({
        //! movie/series posters under /public are loaded cross-origin by the Next.js frontend
        crossOriginResourcePolicy: { policy: "cross-origin" },
    }))
    .use(cors(corsOptions))
    .use(express.urlencoded({ extended: true }))
    .use(cookieParser());


//! Static Folder
app.use("/public", express.static(path.join(__dirname, "public", "actor")));
app.use("/public", express.static(path.join(__dirname, "public", "cover")));
app.use("/public", express.static(path.join(__dirname, "public", "director")));
app.use("/public", express.static(path.join(__dirname, "public", "profile")));
app.use("/public", express.static(path.join(__dirname, "public", "thumbnail")));
app.use("/public", express.static(path.join(__dirname, "public", "trailer")));
app.use("/public", express.static(path.join(__dirname, "public", "videos")));

//! Routes
app.use('/api/user', require('./router/userRoutes'));
app.use('/api/movie', require('./router/movieRoutes'));
app.use('/api/series', require('./router/seriesRoutes'));
app.use('/api/actor', require('./router/actorRoutes'));
app.use('/api/director', require('./router/directorRoutes'));
app.use('/api/review', require('./router/reviewRoutes'));
app.use('/api/season', require('./router/seasonRoutes'));
app.use('/api/episode', require('./router/episodeRoutes'));
app.use("/api/support", require('./router/supportRoutes'));
app.use("/api/like", require('./router/likeRoutes'));
app.use("/api/search", require('./router/searchRoutes'));
app.use("/api/cinema", require('./router/cinemaRoutes'));
app.use("/api/showtime", require('./router/showtimeRoutes'));

//! Global error handler — last resort for thrown/next(err) errors that
//! bypassed a controller's own try/catch (e.g. middleware, multer, bad JSON body)
app.use((err, req, res, next) => {
    console.error(err.stack || err);
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message || "Internal Server Error",
    });
});

app.listen(process.env.PORT, err => {
    if (err) return console.log(err);
    console.log(`Server is running on port ${process.env.PORT}`);
});