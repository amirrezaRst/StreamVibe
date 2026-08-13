const { isValidObjectId } = require('mongoose');
const path = require('path');

const Episode = require('../model/episodeModel');
const Season = require('../model/seasonModel');
const { episodeUploader } = require('../utils/videoUploader');
const { createEpisodeValidation, updateEpisodeValidation } = require('../validation/episodeValidation');
const { guardQuality } = require('../utils/downloadGuard');


//! Single Episode
exports.getEpisodeById = async (req, res) => {
    try {
        const episode = await Episode.findById(req.params.id);
        if (!episode) return res.status(404).json({ status: 404, message: "Episode not found" });

        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            episode
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};


exports.getEpisodeByEpisodeNumber = async (req, res) => {
    const { series, season, episodeNumber } = req.params;

    if (!isValidObjectId(series)) {
        return res.status(400).json({ status: 400, message: "Invalid series ID" });
    }

    if (isNaN(season) || isNaN(episodeNumber)) {
        return res.status(400).json({ status: 400, message: "Season number and episode number must be valid numbers" });
    }

    try {
        const episode = await Episode.findOne({
            series,
            seasonNumber: parseInt(season, 10),
            episodeNumber: parseInt(episodeNumber, 10)
        })
            .populate(
                {
                    path: "series", select: "title trailer director musician release_date genres rotten_rating imdb_rating actors",
                    populate: { path: "director actors musician", select: "directorId actorId fullName slug profile birthPlace country" },
                })
            .select("title files pictures");

        if (!episode) {
            return res.status(404).json({ status: 404, message: "Episode not found" });
        }

        res.status(200).json({
            status: 200,
            message: "Episode fetched successfully",
            episode
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: "An error occurred while fetching the episode",
            error: err.message
        });
    }
};


exports.createEpisode = [episodeUploader, createEpisodeValidation, async (req, res) => {
    //! must send seriesTitle in the body
    //! pictures/files are already mapped onto req.body by createEpisodeValidation
    try {
        const season = await Season.findOne({ series: req.body.series, seasonNumber: req.body.seasonNumber });
        if (!season) return res.status(404).json({ status: 404, message: "Season not found" });

        const newEpisode = await Episode.create(req.body);
        //! push episode id to season model
        season.episodes.push(newEpisode._id);
        await season.save();

        res.status(201).json({
            status: 201,
            message: 'Episode created successfully',
            episode: newEpisode
        });
    } catch (err) {
        res.status(400).json({
            status: 404,
            message: err.message
        });
    }
}];

exports.updateEpisode = [episodeUploader, updateEpisodeValidation, async (req, res) => {
    try {
        const { newFiles, removeFileUrls, ...rest } = req.body;
        const update = { $set: rest };

        //! appended, not overwritten — re-saving the edit form after adding a
        //! 4K file must not silently drop the 1080p one already there
        if (newFiles?.length) update.$push = { files: { $each: newFiles } };
        if (removeFileUrls?.length) update.$pull = { files: { url: { $in: removeFileUrls } } };

        const episode = await Episode.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        });
        if (!episode) return res.status(404).json({ status: 404, message: "Episode not found" });

        res.status(200).json({
            status: 200,
            message: "Episode updated successfully",
            data: {
                episode
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
}];

exports.deleteEpisode = async (req, res) => {
    try {
        const episode = await Episode.findByIdAndDelete(req.params.id);
        if (!episode) return res.status(404).json({ status: 404, message: "Episode not found" });

        await Season.updateOne({ episodes: episode._id }, { $pull: { episodes: episode._id } });

        res.status(200).json({
            status: 204,
            message: "Episode deleted successfully",
            data: null
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};

exports.downloadEpisode = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ status: 400, message: "URL is required" });
    }

    try {
        const denied = await guardQuality(Episode, url, req.entitlement);
        if (denied) return res.status(denied.status).json(denied);

        const videosDir = path.join(__dirname, "..", "public", "videos");
        const file = path.join(videosDir, path.basename(url));

        if (path.dirname(file) !== videosDir) {
            return res.status(400).json({ status: 400, message: "Invalid file path" });
        }

        res.download(file)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: "An error occurred while downloading the episode",
            error: err.message
        });
    }
};