"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { HomeIcon } from "@/assets/Svgs";
import { forgotPassword } from "@/services/UserService";

const ForgotPasswordPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [sent, setSent] = useState(false);

    const onSubmit = async ({ email }) => {
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <main className="w-full min-h-screen bg-c-black-08 flex items-center justify-center px-4">
            <div className="w-full max-w-[440px] py-10 px-8 bg-c-black-06 border border-c-black-15 rounded-xl">
                <div className="flex items-center justify-between mb-10">
                    <img src="/images/logo-white.png" alt="stream vibe logo" className="w-[150px]" />
                    <Link href="/">
                        <span className="text-white flex items-center gap-2 text-super-sm">Back to Home <HomeIcon /></span>
                    </Link>
                </div>

                {sent ? (
                    <div>
                        <h2 className="text-white text-2xl font-semibold mb-4">Check your email</h2>
                        <p className="text-c-grey-65">
                            If an account exists for that email address, we've sent a link to reset your password.
                            The link expires in 30 minutes.
                        </p>
                        <Link href="/register?page=login" className="text-c-red-45 block mt-8 hover:underline">
                            Back to Log In
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 className="text-white text-2xl font-semibold">Forgot Password</h2>
                        <p className="text-c-grey-65 mt-2 text-super-sm">
                            Enter the email address on your account and we'll send you a link to reset your password.
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
                            <div>
                                <label htmlFor="email" className="text-white lg:text-super-sm md:text-sm mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="support-input-field bg-c-black-10"
                                    placeholder="Enter your email"
                                    {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } })}
                                />
                                {errors.email && <span className="text-c-red-50 block">{errors.email.message}</span>}
                            </div>

                            <button
                                className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5 mt-8"
                                type="submit"
                            >
                                Send Reset Link
                            </button>
                        </form>
                    </>
                )}
            </div>
        </main>
    );
}

export default ForgotPasswordPage;
