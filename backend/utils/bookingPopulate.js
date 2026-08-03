//! Every response that hands a booking back to a client needs its showtime —
//! and the showtime's own movie, cinema and hall — populated, or the ticket has
//! nothing to render. Shared so the booking and payment controllers cannot
//! drift apart on it.
module.exports = {
    path: 'showtime',
    select: 'startsAt endsAt language movie cinema hall',
    populate: [
        { path: 'movie', select: 'title thumbnail duration' },
        { path: 'cinema', select: 'name city country address' },
        { path: 'hall', select: 'name screenType' },
    ],
};
