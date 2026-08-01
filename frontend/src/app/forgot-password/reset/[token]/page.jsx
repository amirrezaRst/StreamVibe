"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { HomeIcon } from "@/assets/Svgs";
import { resetPassword } from "@/services/UserService";

const ResetPasswordPage = ({ params }) => {
    const { token } = params;
    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const onSubmit = async ({ password }) => {
        try {
            await resetPassword(token, password);
            toast.success('Your password has been reset. Please log in.');
            router.push('/register?page=login');
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

                <h2 className="text-white text-2xl font-semibold">Choose a New Password</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="password" className="text-white lg:text-super-sm md:text-sm mb-1">New Password</label>
                            <input
                                type="password"
                                id="password"
                                className="support-input-field bg-c-black-10"
                                placeholder="Enter your new password"
                                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                            />
                            {errors.password && <span className="text-c-red-50 block">{errors.password.message}</span>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="text-white lg:text-super-sm md:text-sm mb-1">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="support-input-field bg-c-black-10"
                                placeholder="Re-enter your new password"
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === watch('password') || 'Passwords do not match'
                                })}
                            />
                            {errors.confirmPassword && <span className="text-c-red-50 block">{errors.confirmPassword.message}</span>}
                        </div>
                    </div>

                    <button
                        className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5 mt-10"
                        type="submit"
                    >
                        Reset Password
                    </button>
                </form>
            </div>
        </main>
    );
}

export default ResetPasswordPage;
