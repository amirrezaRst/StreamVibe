"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Link from "next/link";

import { CheckIcon, SpinnerSvg } from "@/assets/Svgs";
import { changePassword, updateProfile } from "@/services/UserService";
import useUserStore from "@/stores/useUserStore";
import ProfileField from "./ProfileField";

const EMAIL_PATTERN = { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" };

const Card = ({ title, hint, children }) => (
    <div className="bg-c-black-10 border border-c-black-15 rounded-2xl md:p-[26px] p-5">
        <h3 className="text-[15px] font-bold text-c-grey-95 mb-1">{title}</h3>
        <p className="text-c-grey-60 text-super-sm mb-5">{hint}</p>
        {children}
    </div>
);

const SubmitButton = ({ busy, busyLabel, children }) => (
    <button
        type="submit"
        disabled={busy}
        className="bg-c-red-45 hover:bg-c-red-45/85 text-white text-super-sm font-bold rounded-lg py-2.5 px-[22px]
            inline-flex items-center gap-2 duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
    >
        {busy && <SpinnerSvg />}
        {busy ? busyLabel : children}
    </button>
);

const SummaryRow = ({ label, value }) => (
    <div className="flex justify-between items-center gap-4 py-3 border-b border-c-black-15 last:border-b-0 text-sm">
        <span className="text-c-grey-60">{label}</span>
        <span className="text-c-grey-90 font-semibold tabular-nums text-end">{value}</span>
    </div>
);

const formatMonth = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const AccountPanel = ({ user, overview }) => {
    const fetchUser = useUserStore((state) => state.fetchUser);
    const [saved, setSaved] = useState(false);

    const details = useForm({ defaultValues: { fullName: user?.fullName || "", email: user?.email || "" } });
    const password = useForm();

    const onSaveDetails = async (values) => {
        try {
            await updateProfile(values);
            await fetchUser();

            //! a toast alone gets lost next to the button that caused it, so
            //! confirm inline as well and let it fade
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            toast.success("Your details were updated.");
        } catch (error) {
            if (/email/i.test(error.message)) {
                details.setError("email", { type: "manual", message: error.message });
                return;
            }
            toast.error(error.message);
        }
    };

    const onChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
        if (newPassword !== confirmPassword) {
            password.setError("confirmPassword", { type: "manual", message: "Both passwords must match" });
            return;
        }

        try {
            await changePassword(currentPassword, newPassword);
            password.reset();
            toast.success("Your password was changed.");
        } catch (error) {
            if (/current password/i.test(error.message)) {
                password.setError("currentPassword", { type: "manual", message: error.message });
                return;
            }
            if (/different/i.test(error.message)) {
                password.setError("newPassword", { type: "manual", message: error.message });
                return;
            }
            toast.error(error.message);
        }
    };

    const subscription = overview?.subscription;
    const isSubscribed = subscription?.status === "active";

    return (
        <div className="grid xl:grid-cols-[1.3fr_1fr] gap-5 items-start">
            <div className="space-y-5">
                <Card title="Personal Information" hint="Update your name and email address.">
                    <form onSubmit={details.handleSubmit(onSaveDetails)} noValidate>
                        <ProfileField
                            id="fullName"
                            label="Full Name"
                            placeholder="Your name"
                            autoComplete="name"
                            register={details.register}
                            error={details.formState.errors.fullName}
                            validation={{
                                required: "Full name is required",
                                minLength: { value: 3, message: "Full name must be at least 3 characters" },
                                maxLength: { value: 50, message: "Full name must be at most 50 characters" },
                            }}
                        />
                        <ProfileField
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            register={details.register}
                            error={details.formState.errors.email}
                            validation={{ required: "Email is required", pattern: EMAIL_PATTERN }}
                        />

                        <div className="flex items-center gap-3 mt-[22px]">
                            <SubmitButton busy={details.formState.isSubmitting} busyLabel="Saving…">
                                Save Changes
                            </SubmitButton>
                            <span className={`flex items-center gap-1.5 text-[13px] text-[#6FCB9C] duration-200 ${saved ? "opacity-100" : "opacity-0"}`}>
                                <CheckIcon className="w-3.5 h-3.5" /> Saved
                            </span>
                        </div>
                    </form>
                </Card>

                <Card title="Change Password" hint="Your current password is required to set a new one.">
                    <form onSubmit={password.handleSubmit(onChangePassword)} noValidate>
                        <ProfileField
                            id="currentPassword"
                            label="Current Password"
                            type="password"
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            register={password.register}
                            error={password.formState.errors.currentPassword}
                            validation={{ required: "Enter your current password" }}
                        />
                        {/*//! no placeholders on this pair: the eye toggle eats the
                            end of the field, and at this column width the hint
                            would be clipped mid-word */}
                        <div className="grid sm:grid-cols-2 gap-x-3.5">
                            <ProfileField
                                id="newPassword"
                                label="New Password"
                                type="password"
                                hint="At least 8 characters"
                                autoComplete="new-password"
                                register={password.register}
                                error={password.formState.errors.newPassword}
                                validation={{
                                    required: "Choose a new password",
                                    minLength: { value: 8, message: "Must be at least 8 characters" },
                                }}
                            />
                            <ProfileField
                                id="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                autoComplete="new-password"
                                register={password.register}
                                error={password.formState.errors.confirmPassword}
                                validation={{ required: "Re-enter your new password" }}
                            />
                        </div>

                        <div className="mt-1">
                            <SubmitButton busy={password.formState.isSubmitting} busyLabel="Updating…">
                                Update Password
                            </SubmitButton>
                        </div>
                    </form>
                </Card>
            </div>

            <Card title="Account Summary" hint="Where your account stands right now.">
                <SummaryRow
                    label="Plan"
                    value={isSubscribed
                        ? <span className="capitalize">{subscription.plan}</span>
                        : "Free"}
                />
                {isSubscribed && <SummaryRow label="Renews on" value={formatDate(subscription.endDate)} />}
                <SummaryRow label="Member since" value={formatMonth(overview?.memberSince)} />
                <SummaryRow label="Watchlist items" value={overview?.counts.watchList ?? "—"} />
                <SummaryRow label="Upcoming bookings" value={overview?.counts.upcomingBookings ?? "—"} />
                <SummaryRow label="Open tickets" value={overview?.counts.openTickets ?? "—"} />

                <Link
                    href="/subscriptions"
                    className="block text-center border border-c-black-20 hover:border-c-grey-60 text-c-grey-65 hover:text-c-grey-90
                        text-super-sm font-semibold rounded-lg py-2.5 px-5 mt-[18px] duration-150"
                >
                    {isSubscribed ? "Manage Subscription" : "Choose a Plan"}
                </Link>
            </Card>
        </div>
    );
}

export default AccountPanel;
