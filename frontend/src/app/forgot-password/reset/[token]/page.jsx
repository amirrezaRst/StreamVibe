"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import AuthAside from "@/components/auth/AuthAside";
import { resetPassword } from "@/services/UserService";

const ResetPasswordPage = ({ params }) => {
    const { token } = params;
    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

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
        <main className="w-full min-h-screen lg:h-screen bg-c-black-08 overflow-hidden">
            <div className="w-full h-full flex">

                <AuthAside
                    title="Choose a New Password"
                    actionHref="/register?page=login"
                    actionLabel="Back to Log In"
                >
                    Pick something at least 8 characters long that you don&apos;t use anywhere else.
                    Once it&apos;s saved, this reset link stops working and you can log in with the new
                    password straight away.
                </AuthAside>

                <section className="lg:w-[50%] w-full h-full py-10 lg:px-14 px-6">
                    <h2 className="text-white text-2.5xl font-semibold">Choose a New Password</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-14">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="password" className="text-white lg:text-super-sm md:text-sm mb-1">New Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="support-input-field bg-c-black-10"
                                    placeholder="Enter your new password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                    })}
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
                                        validate: (value) => value === watch('password') || 'Passwords do not match',
                                    })}
                                />
                                {errors.confirmPassword && <span className="text-c-red-50 block">{errors.confirmPassword.message}</span>}
                            </div>
                        </div>

                        <button
                            className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5 mt-12 disabled:opacity-60"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving…" : "Reset Password"}
                        </button>
                    </form>

                    <p className="text-white mt-10">
                        Changed your mind?{" "}
                        <Link href="/register?page=login" className="text-c-red-45 cursor-pointer hover:underline">
                            Log In
                        </Link>
                    </p>
                </section>

            </div>
        </main>
    );
}

export default ResetPasswordPage;
