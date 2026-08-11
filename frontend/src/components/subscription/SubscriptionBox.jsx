"use client";

import useUserStore from "@/stores/useUserStore";
import Link from "next/link";


const SubscriptionBox = () => {
    const user = useUserStore((state) => state.user);
    const timeTrial = user?.timeTrial;

    return (
        <section className="container lg:pt-10 md:pt-6 pt-2 lg:pb-16 pb-14">
            <div
                className="subscription-box"
            >
                <div className="flex-1">
                    <h5 className="text-white font-semibold 3xl:text-4xl md:text-3xl text-xl 3xl:mb-7 mb-5">
                        {!timeTrial ? "Experience StreamVibe Free for 7 Days!" : "Unlock Premium Content"}
                    </h5>
                    <p className="text-c-grey-60 3xl:text-[1.36rem] md:text-sm text-xs tracking-wide">
                        {!timeTrial ?
                            "Take advantage of our free trial to explore all the features StreamVibe has to offer. Sign up now and start enjoying!" :
                            "Upgrade to a subscription plan to continue enjoying our exclusive content. Choose the plan that best fits your needs."
                        }
                    </p>
                </div>
                <Link href="/subscriptions">
                    <button
                        className="bg-c-red-45 text-white 3xl:text-[1.35rem] md:text-base text-super-sm rounded-md 3xl:py-4 md:py-2.5 py-2 3xl:px-8 px-4"
                    >
                        {!timeTrial ? "Start Free Trial" : "Select a Plan"}
                    </button>
                </Link>
            </div>
        </section>
    );
}

export default SubscriptionBox;