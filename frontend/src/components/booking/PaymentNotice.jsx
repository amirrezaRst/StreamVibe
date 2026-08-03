/**
 * Says out loud that no money moves here. This is a public portfolio — someone
 * arriving from GitHub reaches a card form with no way of knowing whether it is
 * real, and no way of knowing what to type into it. Both answered up front.
 */
const PaymentNotice = () => (
    <div className="bg-[#D99A34]/[0.14] border border-[#D99A34]/30 rounded-[10px] py-2.5 px-3 mb-3 flex gap-2.5 items-start">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="text-[#E8B663] shrink-0 mt-px">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
        </svg>
        <div>
            <p className="text-xs font-bold text-[#E8B663] mb-0.5">Test payments only</p>
            <p className="text-[11.5px] text-c-grey-65 leading-relaxed">
                No card is ever charged. Use{" "}
                <span className="font-mono text-c-grey-90 tracking-tight">4242 4242 4242 4242</span>,
                any future date, any CVC.
            </p>
        </div>
    </div>
);

export default PaymentNotice;
