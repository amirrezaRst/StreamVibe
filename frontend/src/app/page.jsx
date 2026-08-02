import SubscriptionBox from "@/components/subscription/SubscriptionBox";
import SubscriptionPlan from "@/components/subscription/SubscriptionPlan";
import HomeBanner from "@/components/home/HomeBanner";
import HomeExperience from "@/components/home/HomeExperience";
import HomeMovieCategory from "@/components/home/HomeMovieCategory";
import AskedQuestion from "@/components/question/AskedQuestions";
import HomeTitle from "@/components/home/HomeTitle";
import NowInCinemas from "@/components/booking/NowInCinemas";

export default function Home() {
  return (
    <>
      <HomeBanner />

      <HomeTitle />

      <HomeMovieCategory />

      <NowInCinemas />

      <HomeExperience />

      <AskedQuestion />

      <SubscriptionPlan />

      <SubscriptionBox />

    </>
  );
}
