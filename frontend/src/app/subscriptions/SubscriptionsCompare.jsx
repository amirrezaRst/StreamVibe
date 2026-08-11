import { CheckIcon } from "@/assets/Svgs";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_ORDER } from "@/constants/PlanFeatures";

/**
 * The comparison table the "Compare our plans" heading has always promised.
 * This component existed as an empty <section> that was never even imported,
 * so the page rendered a heading, a paragraph, and then a gap.
 */

const Cell = ({ value }) => {
    if (value === true) {
        return (
            <>
                <CheckIcon className="w-4 h-4 text-[#3DA872] inline" aria-hidden="true" />
                <span className="sr-only">Included</span>
            </>
        );
    }
    if (value === false) {
        return (
            <>
                <span className="text-c-grey-60" aria-hidden="true">—</span>
                <span className="sr-only">Not included</span>
            </>
        );
    }
    return <span className="text-c-grey-90">{value}</span>;
};

const SubscriptionsCompare = () => {
    return (
        //! horizontal scroll lives on this wrapper, not the page — three plan
        //! columns plus a label column cannot compress below a phone's width
        <div className="overflow-x-auto custom-scrollbar custom-scrollbar-sm -mx-3.5 px-3.5 md:mx-0 md:px-0">
            <table className="w-full min-w-[560px] border-collapse text-left">
                <caption className="sr-only">
                    StreamVibe plan comparison: what the Basic, Standard and Premium plans each include
                </caption>
                <thead>
                    <tr className="border-b border-c-black-15">
                        <th scope="col" className="py-4 pr-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-c-grey-60">
                            Features
                        </th>
                        {PLAN_ORDER.map((plan) => (
                            <th
                                key={plan}
                                scope="col"
                                className="py-4 px-4 text-center text-super-sm font-bold text-white whitespace-nowrap"
                            >
                                {PLAN_LABELS[plan]}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {PLAN_FEATURES.map((feature) => (
                        <tr key={feature.label} className="border-b border-c-black-15 last:border-b-0">
                            <th scope="row" className="py-4 pr-4 font-normal align-top">
                                <span className="block text-super-sm text-c-grey-90 font-semibold">{feature.label}</span>
                                {feature.hint && (
                                    <span className="block text-xs text-c-grey-60 mt-0.5">{feature.hint}</span>
                                )}
                            </th>
                            {PLAN_ORDER.map((plan) => (
                                <td key={plan} className="py-4 px-4 text-center text-super-sm align-top whitespace-nowrap">
                                    <Cell value={feature.values[plan]} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SubscriptionsCompare;
