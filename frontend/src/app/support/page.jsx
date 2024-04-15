import AskedQuestions from "@/components/AskedQuestions";
import SubscriptionBox from "@/components/SubscriptionBox";

const SupportPage = () => {
    return (
        <main className="container lg:pt-20 pt-10 lg:pb-8">

            <section className="grid grid-cols-5 xl:gap-10 lg:gap-6 md:gap-4 gap-8">

                <div className="md:col-span-2 col-span-full">
                    <h3 className="text-white 2xl:text-3xl xl:text-2.5xl lg:text-2xl md:text-xl text-2.5xl font-semibold mb-2 max-md:leading-tight">Welcome to our support page!</h3>
                    <p className="text-c-grey-60 2xl:text-super-sm lg:text-sm text-super-xs">We're here to help you with any problems you may be having with our product.</p>
                    <div className="w-full">
                        <img src="/images/subscription-box-image-mobile.jpg" className="border-2 border-c-black-15 rounded-lg w-full mt-5" alt="" />
                    </div>
                </div>
                <div
                    className="md:col-span-3 col-span-full bg-c-black-06 border border-c-black-15 rounded-lg xl:px-8 px-5 xl:py-7 py-5"
                >
                    <div className="md:grid md:grid-cols-2 xl:gap-x-6 gap-x-4 lg:gap-y-4 gap-y-2 max-md:space-y-3">

                        <div>
                            <label htmlFor="" className="text-white lg:text-super-sm md:text-sm">First Name</label>
                            <input type="text"
                                className="support-input-field"
                                placeholder="Enter First Name" />
                        </div>
                        <div>
                            <label htmlFor="" className="text-white lg:text-super-sm md:text-sm">Last Name</label>
                            <input type="text"
                                className="support-input-field"
                                placeholder="Enter Last Name" />
                        </div>
                        <div>
                            <label htmlFor="" className="text-white lg:text-super-sm md:text-sm">Email</label>
                            <input type="text"
                                className="support-input-field"
                                placeholder="Enter your Email" />
                        </div>
                        <div>
                            <label htmlFor="" className="text-white lg:text-super-sm md:text-sm">Email</label>
                            <input type="text"
                                className="support-input-field"
                                placeholder="Enter your Email" />
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="" className="text-white lg:text-super-sm md:text-sm">Message</label>
                            <textarea type="text"
                                className="support-input-field"
                                rows={3}
                                placeholder="Enter your Message" />
                        </div>

                    </div>
                    <div className="flex lg:flex-row flex-col lg:items-center max-lg:gap-4 justify-between mt-3.5">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="" id="agree-policy" className="accent-c-black-15 w-5 h-5" />
                            <label htmlFor="agree-policy" className="text-c-grey-60 xl:text-sm text-super-xs">I agree with Terms of Use and Privacy Policy</label>
                        </div>
                        <button className="bg-c-red-45 text-white py-2 px-4 rounded text-super-sm">Send Message</button>
                    </div>
                </div>

            </section>

            <AskedQuestions />

            <SubscriptionBox />


        </main>
    );
}

export default SupportPage;