//! How many independent readers have to say a review gives something away
//! before it is hidden behind a warning. One is too easy to weaponise against a
//! review somebody simply disagrees with; three would rarely be reached on a
//! title that is not already popular.
exports.SPOILER_REPORTS_NEEDED = 2;

exports.REVIEW_STATUSES = ['pending', 'approved', 'rejected'];
