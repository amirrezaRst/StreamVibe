const Cinema = require('../model/cinemaModel');
const Hall = require('../model/hallModel');
const Showtime = require('../model/showtimeModel');


//! Get Request
exports.getHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id).populate('cinema', 'name city country address');
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        res.status(200).json({ status: 200, message: "Hall fetched successfully", hall });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Post Request
exports.createHall = async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.body.cinema);
        if (!cinema) return res.status(404).json({ status: 404, message: "Cinema not found" });

        const duplicateSeat = findDuplicateSeat(req.body.seatMap);
        if (duplicateSeat) {
            return res.status(400).json({ status: 400, message: `Duplicate seat "${duplicateSeat}" in the seat map` });
        }

        const hall = await Hall.create(req.body);
        res.status(201).json({ status: 201, message: "Hall created successfully", hall });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Put Request
exports.updateHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id);
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        if (req.body.seatMap) {
            const duplicateSeat = findDuplicateSeat(req.body.seatMap);
            if (duplicateSeat) {
                return res.status(400).json({ status: 400, message: `Duplicate seat "${duplicateSeat}" in the seat map` });
            }

            //! reshaping seats under a live showtime would invalidate seats people already hold
            const upcoming = await Showtime.countDocuments({
                hall: hall._id,
                startsAt: { $gte: new Date() },
                status: 'scheduled'
            });
            if (upcoming > 0) {
                return res.status(409).json({
                    status: 409,
                    message: `This hall has ${upcoming} upcoming showtime(s). Its seat map can't be changed until they're done or cancelled.`
                });
            }
        }

        const updatedHall = await Hall.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ status: 200, message: "Hall updated successfully", hall: updatedHall });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! Delete Request
exports.deleteHall = async (req, res) => {
    try {
        const hall = await Hall.findById(req.params.id);
        if (!hall) return res.status(404).json({ status: 404, message: "Hall not found" });

        const upcoming = await Showtime.countDocuments({
            hall: hall._id,
            startsAt: { $gte: new Date() },
            status: 'scheduled'
        });
        if (upcoming > 0) {
            return res.status(409).json({
                status: 409,
                message: `This hall has ${upcoming} upcoming showtime(s). Cancel them before deleting it.`
            });
        }

        await hall.deleteOne();

        res.status(200).json({ status: 200, message: "Hall deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};


//! seat labels are the booking key (row + number), so a duplicate would make two
//! physical seats indistinguishable once tickets are issued
function findDuplicateSeat(seatMap = []) {
    const seen = new Set();

    for (const { row, seats = [] } of seatMap) {
        for (const seat of seats) {
            const label = `${String(row).toUpperCase()}${seat.number}`;
            if (seen.has(label)) return label;
            seen.add(label);
        }
    }
    return null;
}
