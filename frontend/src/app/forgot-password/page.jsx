"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import AuthAside from "@/components/auth/AuthAside";
import { forgotPassword } from "@/services/UserService";

const ForgotPasswordPage = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [sentTo, setSentTo] = useState(null);

    const onSubmit = async ({ email }) => {
        try {
            await forgotPassword(email);
            setSentTo(email);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <main className="w-full min-h-screen lg:h-screen bg-c-black-08 overflow-hidden">
            <div className="w-full h-full flex">

                <AuthAside
                    title="Forgot Password"
                    actionHref="/register?page=login"
                    actionLabel="Back to Log In"
                >
                    It happens. Enter the email address on your account and we&apos;ll send over a link to
                    set a new password. The link stays valid for 30 minutes, and your current password
                    keeps working until you choose a new one.
                </AuthAside>

                <section className="lg:w-[50%] w-full h-full py-10 lg:px-14 px-6">
                    {sentTo ? (
                        <>
                            <h2 className="text-white text-2.5xl font-semibold">Check your email</h2>

                            <p className="text-c-grey-65 mt-6 leading-7">
                                If an account exists for <span className="text-white">{sentTo}</span>, a link to
                                reset your password is on its way. The link expires in 30 minutes.
                            </p>

                            <p className="text-c-grey-60 text-super-sm mt-6">
                                Didn&apos;t get it? Check your spam folder, or{" "}
                                <button
                                    type="button"
                                    onClick={() => setSentTo(null)}
                                    className="text-c-red-45 hover:underline"
                                >
                                    try another address
                                </button>.
                            </p>

                            <Link href="/register?page=login">
                                <button
                                    type="button"
                                    className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5 mt-12"
                                >
                                    Back to Log In
                                </button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <h2 className="text-white text-2.5xl font-semibold">Forgot Password</h2>

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-14">
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="text-white lg:text-super-sm md:text-sm mb-1">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="support-input-field bg-c-black-10"
                                            placeholder="Enter your email"
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                                            })}
                                        />
                                        {errors.email && <span className="text-c-red-50 block">{errors.email.message}</span>}
                                    </div>
                                </div>

                                <button
                                    className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5 mt-12 disabled:opacity-60"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Sending…" : "Send Reset Link"}
                                </button>
                            </form>

                            <p className="text-white mt-10">
                                Remembered it?{" "}
                                <Link href="/register?page=login" className="text-c-red-45 cursor-pointer hover:underline">
                                    Log In
                                </Link>
                            </p>
                        </>
                    )}
                </section>

            </div>
        </main>
    );
}

export default ForgotPasswordPage;
