import SubscriptionBox from "@/components/subscription/SubscriptionBox";
import SubscriptionPlan from "@/components/subscription/SubscriptionPlan";
import HomeBanner from "@/components/home/HomeBanner";
import HomeExperience from "@/components/home/HomeExperience";
import HomeMovieCategory from "@/components/home/HomeMovieCategory";
import AskedQuestion from "@/components/question/AskedQuestions";
import HomeTitle from "@/components/home/HomeTitle";
import NowInCinemas from "@/components/booking/NowInCinemas";
import JsonLd from "@/components/seo/JsonLd";
import { siteSchema } from "@/utils/structuredData";

//! title and description come from the root layout; this only pins the
//! canonical, so the site reached with a trailing slash or a tracking
//! parameter still resolves to one address
export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <JsonLd data={siteSchema()} />
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
