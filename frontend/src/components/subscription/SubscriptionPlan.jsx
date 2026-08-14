"use client";

import { useEffect, useState } from "react";
import SubscriptionPlanTitle from "./SubscriptionPlanTitle";

import useUserStore from "@/stores/useUserStore";
import { fetchPlans } from "@/services/SubscriptionService";
import SubscriptionPlanSkeleton from "./SubscriptionPlanSkeleton";
import SubscriptionPlanContent from "./SubscriptionPlanContent";


const SubscriptionPlan = () => {

    const user = useUserStore(state => state.user);
    const [time, setTime] = useState("monthly");
    const [loading, setLoading] = useState(false);
    //! prices come from the server that will charge them, so the page cannot
    //! advertise one number while checkout bills another
    const [plans, setPlans] = useState(null);

    useEffect(() => {
        fetchPlans()
            .then(({ plans: fetched }) => setPlans(fetched))
            //! the cards still render from the bundled copy if this fails —
            //! a pricing page that shows nothing is worse than one a beat stale,
            //! and the charge is built server-side either way
            .catch(() => setPlans(null));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [time]);

    const handleClick = (newTime) => {
        setLoading(true);
        setTime(newTime);
    };

    return (
        <section className="container py-16">
            <SubscriptionPlanTitle time={time} handleClick={handleClick} />

            <div className="grid lg:grid-cols-3 md:grid-cols-2 3xl:gap-8 lg:gap-4 gap-5 md:mt-8 mt-10">

                {loading ?
                    Array.from({ length: 3 }).map((_, index) => <SubscriptionPlanSkeleton key={index} />) :
                    <SubscriptionPlanContent user={user} time={time} plans={plans} />
                }

            </div>

        </section>
    );
}

export default SubscriptionPlan;