const { isValidObjectId } = require('mongoose');
const Season = require('../model/seasonModel');
const Series = require('../model/seriesModel');
const { deleteEpisodesOfSeason } = require('../utils/cascadeDelete');


//! Get Request
exports.getSeason = async (req, res) => {
    try {
        const season = await Season.findById(req.params.id).populate('episodes');
        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            data: {
                season
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};

exports.getSeasonsBySeries = async (req, res) => {
    const { seriesId } = req.params;

    if (!isValidObjectId(seriesId)) return res.status(400).json({ status: 400, message: "Invalid ID" });

    try {
        const seasons = await Season.find({ series: seriesId }).populate('episodes');
        res.status(200).json({
            status: 200,
            message: "fetch data successfully",
            seasons
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};



//! Post Request
exports.createSeason = async (req, res) => {
    try {
        const series = await Series.findById(req.body.series);
        if (!series) return res.status(404).json({ status: 404, message: "series not found" });

        if (!req.body.seasonNumber) {
            const isSeason = await Season.find({ series: req.body.series });
            req.body.seasonNumber = isSeason.length + 1;
        }

        const newSeason = await Season.create(req.body);


        series.seasons.push(newSeason._id);
        await series.save();

        res.status(201).json({
            status: 200,
            message: "season created successfully",
            data: {
                season: newSeason
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 404,
            message: err.message
        });
    }
};


//! must edit or delete this controller
//! Patch Request
exports.updateSeason = async (req, res) => {
    try {
        const season = await Season.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: 200,
            message: "season updated successfully",
            data: {
                season
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};



//! Delete Request
exports.deleteSeason = async (req, res) => {
    try {
        const season = await Season.findByIdAndDelete(req.params.id);
        if (!season) return res.status(404).json({ message: "Season not found" });

        await deleteEpisodesOfSeason(season);

        //! find series and delete season from seasons field in series
        const series = await Series.findById(season.series);
        series.seasons = series.seasons.filter(seasonId => seasonId.toString() !== season._id.toString());
        await series.save();


        res.status(200).json({
            status: 200,
            message: "season deleted successfully",
            data: null
        });
    } catch (err) {
        res.status(404).json({
            status: 404,
            message: err.message
        });
    }
};