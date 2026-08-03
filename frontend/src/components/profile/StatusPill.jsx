//! Semantic status colours, kept away from the brand red on purpose: red is
//! the accent everywhere else on the site, so using it for "cancelled" would
//! read as emphasis rather than as a warning.
const TONES = {
    pending: "bg-[#D99A34]/[0.14] text-[#E8B663]",
    "in progress": "bg-[#4C8DD9]/[0.14] text-[#7CADEA]",
    resolved: "bg-[#3DA872]/[0.14] text-[#6FCB9C]",
    confirmed: "bg-[#3DA872]/[0.14] text-[#6FCB9C]",
    cancelled: "bg-[#E5477A]/[0.14] text-[#E5477A]",
    refunded: "bg-[#4C8DD9]/[0.14] text-[#7CADEA]",
    expired: "bg-c-black-15 text-c-grey-60",
};

const StatusPill = ({ status }) => (
    <span className={`text-[11.5px] font-bold py-[3px] px-2.5 rounded-full capitalize shrink-0 ${TONES[status] || TONES.expired}`}>
        {status}
    </span>
);

export default StatusPill;
