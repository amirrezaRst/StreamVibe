const Episode = require('../model/episodeModel');
const Season = require('../model/seasonModel');
const Review = require('../model/reviewModel');
const Like = require('../model/likeModel');

const deleteEpisodesOfSeason = (season) => Episode.deleteMany({ _id: { $in: season.episodes } });

const deleteSeasonsOfSeries = async (seriesId) => {
    const seasons = await Season.find({ series: seriesId });
    await Promise.all(seasons.map(deleteEpisodesOfSeason));
    await Season.deleteMany({ series: seriesId });
};

const deleteMediaReferences = (mediaId) => Promise.all([
    Review.deleteMany({ media: mediaId }),
    Like.deleteMany({ media: mediaId })
]);

module.exports = { deleteEpisodesOfSeason, deleteSeasonsOfSeries, deleteMediaReferences };
