const TIER_SWATCH = {
    standard: "bg-[#48505C]/40 border-[#48505C]",
    premium: "bg-[#8A5A2B]/35 border-[#8A5A2B]",
    vip: "bg-[#8A7320]/35 border-[#8A7320]",
};

const Item = ({ swatch, children }) => (
    <div className="flex items-center gap-2 text-[12.5px] text-c-grey-70">
        <span className={`w-[17px] h-[17px] rounded-t-[5px] rounded-b-[2px] border ${swatch}`} />
        {children}
    </div>
);

const SeatLegend = ({ pricing = {} }) => (
    <div className="flex gap-5 flex-wrap justify-center items-center mt-6 pt-5 border-t border-c-black-15">
        {/*//! only tiers this screening actually prices are worth explaining */}
        {Object.keys(TIER_SWATCH)
            .filter(tier => pricing?.[tier] !== undefined && pricing?.[tier] !== null)
            .map(tier => (
                <Item key={tier} swatch={TIER_SWATCH[tier]}>
                    <span className="capitalize">{tier}</span>
                    <b className="text-c-grey-90 tabular-nums">${pricing[tier]}</b>
                </Item>
            ))}

        <Item swatch="bg-c-red-45 border-c-red-60">Selected</Item>
        <Item swatch="bg-c-black-12 border-c-black-15 opacity-55">Taken</Item>
    </div>
);

export default SeatLegend;
