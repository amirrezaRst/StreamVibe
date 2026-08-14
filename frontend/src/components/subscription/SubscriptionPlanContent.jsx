import { planVariantMonthly, planVariantYearly } from "@/constants/PlansVariant";
import SubscriptionPlanItem from "./SubscriptionPlanItem";
import SubscriptionPlanSkeleton from "./SubscriptionPlanSkeleton";

/**
 * `plans` is the server's price list. The bundled copy in PlansVariant.js is
 * still what supplies the card copy (title and blurb), but the number on the
 * card comes from the server whenever it answered — that is the same constant
 * checkout builds the charge from, so what is shown and what is billed cannot
 * drift apart.
 */
const SubscriptionPlanContent = ({ user, time, plans }) => {
    const cycle = time === "yearly" ? "year" : "month";
    const variants = time === "yearly" ? planVariantYearly : planVariantMonthly;

    const priceFor = (type, fallback) => {
        const match = plans && plans.find(plan => plan.id === type);
        const live = match && match.price && match.price[cycle];
        return live != null ? live.toFixed(2) : fallback;
    };

    return (
        <>
            {variants.map(({ title, subtitle, price, type }, index) =>
                user === null ?
                    <SubscriptionPlanSkeleton key={index} /> :
                    <SubscriptionPlanItem
                        key={index}
                        title={title}
                        subtitle={subtitle}
                        price={priceFor(type, price)}
                        time={cycle}
                        planType={type}
                    />
            )}
        </>
    );
}

export default SubscriptionPlanContent;
