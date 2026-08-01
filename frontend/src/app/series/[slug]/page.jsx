import { Suspense } from "react";

import ReviewSection from "@/components/review/ReviewSection";
import CastSection from "@/components/singlePage/CastSection";
import Description from "@/components/singlePage/Description";
import SeasonsSection from "@/components/singleSeries/SeasonsSection";
import SinglePageLayout from "@/components/layout/singlePage/SinglePageLayout";
import SinglePageSkeleton from "@/components/layout/singlePage/SinglePageSkeleton";
import { notFound } from "next/navigation";
import { apiFetch } from "@/services/apiClient";


const fetchSingleSeries = async (slug) => {
    const res = await apiFetch(`/series/${slug}`);
    const data = await res.json();
    if (data?.status === 404) return notFound();
    return data;
}

const SingleSeries = async ({ params }) => {
    const { slug } = params;

    const { series: seriesData, pictures } = await fetchSingleSeries(slug);

    if (!seriesData || !pictures) return <SinglePageSkeleton />;

    const { _id: id, title, description, actors } = seriesData;

    return (
        <Suspense fallback={<SinglePageSkeleton />}>
            <SinglePageLayout
                data={seriesData}
                type="series"
            >
                {/*//! Seasons List Section */}
                <SeasonsSection id={id} seriesTitle={title} />

                {/*//! Description Section */}
                <Description description={description} />

                {/*//! Cast Section */}
                <CastSection actors={actors} />

                {/*//! Previews Section */}
                <ReviewSection id={id} />
            </SinglePageLayout>
        </Suspense>
    );
}

export default SingleSeries;