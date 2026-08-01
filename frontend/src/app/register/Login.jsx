import { useState } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";

import useUserStore from "@/stores/useUserStore";
import { apiFetch } from "@/services/apiClient";


const LoginPage = ({ page, setPage }) => {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors }, setError } = useForm();
    const fetchUser = useUserStore((state) => state.fetchUser);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (data) => {
        const { email, password, remember } = data;

        try {
            const loginResponse = await apiFetch('/user/login', {
                method: 'POST',
                body: JSON.stringify({ email, password, remember }),
            });

            if (!loginResponse.ok) {
                const error = await loginResponse.json();
                throw { status: loginResponse.status, message: error.message };
            }
            await fetchUser();
            router.push("/");
            toast.success('Login successful!');
        } catch (err) {
            if (!err.status) { //! a real network/fetch failure, not the {status, message} we threw above
                return toast.error("Something went wrong! Please try again later.");
            }

            const { status } = err;

            if (status === 500) {
                return toast.error("Server error! Please try again later.");
            }

            if (status === 404) {
                return setError("email", { type: "manual", message: "User not found!" });
            }

            if (status === 401) {
                return setError("password", { type: "manual", message: "Incorrect password!" });
            }

            toast.error("Login failed! Please try again.");
        }
    };



    return (
        <section
            className={`w-[50%] h-full transition-all duration-700 py-10 px-14
                     ${page == "signup" && "delay-500"} ${page == "signup" ? "translate-x-full" : "translate-x-0"}`}
        >
            <h2 className="text-white text-2.5xl font-semibold">Log In Form</h2>

            <form onSubmit={handleSubmit(handleLogin)} className="mt-14">
                <div className="space-y-6">

                    <div>
                        <label htmlFor={"email"} className="text-white lg:text-super-sm md:text-sm mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            className={`support-input-field bg-c-black-10`}
                            placeholder="Enter your email"
                            {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } })}
                        />
                        {errors.email && <span className="text-c-red-50 block">{errors.email.message}</span>}
                    </div>

                    <div>
                        <label htmlFor={"password"} className="text-white lg:text-super-sm md:text-sm mb-1">password</label>
                        <input
                            type="password"
                            id="password"
                            className={`support-input-field bg-c-black-10`}
                            placeholder="Enter your password"
                            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                        />
                        {errors.password && <span className="text-c-red-50 block">{errors.password.message}</span>}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                {...register('remember')}
                            />
                            <label htmlFor="remember" className="text-white">Remember me</label>
                        </div>
                        <Link href="/forgot-password" className="text-white">
                            Forgot Password?
                        </Link>
                    </div>

                </div>

                <button
                    className="bg-c-red-45 text-white text-super-base font-medium rounded-full px-14 py-3.5 mt-12"
                    type="submit"
                >
                    Log In
                </button>
            </form>        </section>
    );
}

export default LoginPage;