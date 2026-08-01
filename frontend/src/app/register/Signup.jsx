import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import useUserStore from "@/stores/useUserStore";
import { apiFetch } from "@/services/apiClient";


const SignupPage = ({ page, setPage }) => {

    const router = useRouter();
    const { register, handleSubmit, formState: { errors }, setError } = useForm();
    const fetchUser = useUserStore((state) => state.fetchUser);


    const handleSignup = async (data) => {
        const { fullName, email, password, remember } = data;

        try {
            const response = await apiFetch('/user/register', {
                method: 'POST',
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    remember
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const { status } = response;

                if (status === 500) {
                    return toast.error("Server error! Please try again later.");
                }

                if (status === 409) {
                    return setError("email", { type: "manual", message: "User already exists!" }); // Set error for user exists
                }
                console.log(errorData)
                return toast.error("Signup failed! Please try again.");
            }

            const res = await response.json();
            
            await fetchUser();
            
            router.push("/");
            toast.success('Signup successful!');
        } catch (err) {
            toast.error("Something went wrong! Please try again later.");
        }
    };




    return (
        <section className={`w-[50%] h-full transition-all duration-700 py-10 px-14
            ${page == "login" && "delay-500"} ${page == "login" ? "-translate-x-full" : "translate-x-0"}`
        }
        >
            <h2 className="text-white text-2.5xl font-semibold">Sign Up Form</h2>

            <form onSubmit={handleSubmit(handleSignup)} className="mt-14">

                <div className="space-y-6">
                    <div>
                        <label htmlFor={"fullName"} className="text-white lg:text-super-sm md:text-sm mb-1">Full name</label>
                        <input
                            type="text"
                            id="fullName"
                            className={`support-input-field bg-c-black-10`}
                            placeholder="Enter your full name"
                            {...register('fullName', { required: 'Full name is required', minLength: { value: 3, message: 'Full name must be at least 3 characters' } })}
                        />
                        {errors.fullName && <span className="text-c-red-50 block">{errors.fullName.message}</span>}
                    </div>
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
                        <label htmlFor={"password"} className="text-white lg:text-super-sm md:text-sm mb-1">Password</label>
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
                >
                    Sign Up
                </button>

                <p className="text-white mt-10">
                    Already have an account?
                    <span className="text-c-red-45 cursor-pointer hover:underline" onClick={() => { setPage("login") }}>Log In</span>
                </p>


            </form>
        </section>
    );
}

export default SignupPage;