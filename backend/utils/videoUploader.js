const multer = require('multer');
const shortid = require("shortid");
const path = require("path"); // Ensure path is required for filename extension extraction

const sanitizeSegment = (value) => String(value).trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir;
        switch (file.fieldname) {
            case 'thumbnail':
            case 'pictures':
                dir = 'public/thumbnail';
                break;
            case 'cover':
                dir = 'public/cover';
                break;
            case 'trailer':
                dir = 'public/trailer';
                break;
            case 'files':
                dir = 'public/videos';
                break;
            default:
                dir = 'public/';
        }
        cb(null, dir);
    },
    filename: async (req, file, cb) => {
        const ext = path.extname(file.originalname);

        if (req.body.episodeNumber) {
            const { seasonNumber, episodeNumber, seriesTitle } = req.body;
            const title = sanitizeSegment(seriesTitle);
            cb(null, `${title}-Season${seasonNumber}Episode${episodeNumber}-${shortid.generate()}-streamvibe${ext}`);
        }
        else {
            const title = sanitizeSegment(req.body.title);
            const releaseDate = sanitizeSegment(req.body.release_date);
            cb(null, `${title}-${releaseDate}-${shortid.generate()}-streamvibe${ext}`);
        }
    },
});

const IMAGE_TYPES = /\.(jpe?g|png|webp)$/i;
const VIDEO_TYPES = /\.(mp4|mkv|webm|mov|avi)$/i;

const fileFilter = (req, file, cb) => {
    const isVideoField = file.fieldname === 'files';
    const allowed = isVideoField ? VIDEO_TYPES : IMAGE_TYPES;

    if (!allowed.test(file.originalname)) {
        return cb(new Error(
            isVideoField
                ? 'Please upload a valid video file (mp4, mkv, webm, mov, avi)'
                : 'Please upload a valid image file (jpg, jpeg, png, webp)'
        ));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB ceiling covers video uploads; blocks unbounded disk-fill
    },
});


//! movie controller
exports.movieUploader = upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: "cover", maxCount: 1 }, { name: 'trailer', maxCount: 1 }, { name: 'files' }]);

//! series controller
exports.seriesUploader = upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: "cover", maxCount: 1 }, { name: 'trailer', maxCount: 1 }]);

//! episode controller
exports.episodeUploader = upload.fields([{ name: 'files' }, { name: 'pictures', maxCount: 2 }]);
