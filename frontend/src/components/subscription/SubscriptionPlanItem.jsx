"use client";
import useUserStore from "@/stores/useUserStore";
import DialogModal from "../modal/DialogModal";
import { useState } from "react";
import Link from "next/link";
import FreeTrialModalContent from "./FreeTrialModalContent";
import SubscriptionModalContent from "./SubscriptionModalContent";

const SubscriptionPlanItem = ({ time, title, subtitle, price, planType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const user = useUserStore(state => state.user);

    const handleSubscription = (type) => {
        if (type === "freeTrial") {
            setModalContent(<FreeTrialModalContent id={user?._id} setIsOpen={setIsOpen} />);
        } else {
            setModalContent(<SubscriptionModalContent time={time} plan={planType} price={price} setIsOpen={setIsOpen} />);
        }
        setIsOpen(true);
    };


    return (
        <>
            <div className="flex flex-col justify-between bg-c-black-10 border border-c-black-15 3xl:px-8 3xl:py-6 px-6 py-4 rounded-lg">
                <>
                    <h6 className="text-white font-bold 3xl:text-2xl text-super-base mb-2">{title}</h6>
                    <p className="text-c-grey-60 3xl:text-lg xl:text-sm md:text-super-xs text-xs mb-5">{subtitle}</p>
                </>

                <div>
                    <p className="">
                        <span className="text-white font-semibold 3xl:text-3xl text-xl">${price}</span>
                        <span className="text-c-grey-60 3xl:text-xl text-sm">/{time}</span>
                    </p>

                    <div
                        className="flex items-center xl:gap-4 md:gap-2 gap-4 mt-6 text-white xl:text-sm md:text-super-xs text-super-sm"
                    >
                        {user?.subscription?.status === "active" ?
                            <button
                                className="bg-c-black-20 border border-c-black-15 flex-1 3xl:text-[1.23rem] 3xl:py-3.5 md:py-2.5 py-2.5 px-3.5 rounded w-full"
                                disabled
                            >
                                Plan Currently Active
                            </button> :
                            user?.timeTrial ?
                                <button
                                    className="bg-c-red-45 flex-1 3xl:text-[1.23rem] 3xl:py-3.5 md:py-2.5 py-2.5 px-3.5 rounded w-full"
                                    onClick={() => handleSubscription("choose")}
                                >
                                    Choose Plan
                                </button>
                                :
                                <>
                                    <button
                                        className="bg-c-black-08 flex-1 border border-c-black-15 3xl:text-[1.23rem] 3xl:py-3.5 md:py-2 py-2.5 px-3 rounded"
                                        onClick={() => handleSubscription("freeTrial")}
                                    >
                                        Start Free Trial
                                    </button>
                                    <button
                                        className="bg-c-red-45 flex-1 3xl:text-[1.23rem] 3xl:py-3.5 md:py-2 py-2.5 px-3.5 rounded"
                                        onClick={() => handleSubscription("choose")}
                                    >
                                        Choose Plan
                                    </button>
                                </>
                        }
                    </div>
                </div>
            </div>
            <DialogModal user={user} isOpen={isOpen} setIsOpen={setIsOpen}>
                {modalContent}
            </DialogModal>
        </>
    );
}

export default SubscriptionPlanItem;