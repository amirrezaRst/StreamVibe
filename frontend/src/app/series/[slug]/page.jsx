import { cache, Suspense } from "react";

import ReviewSection from "@/components/review/ReviewSection";
import CastSection from "@/components/singlePage/CastSection";
import Description from "@/components/singlePage/Description";
import SeasonsSection from "@/components/singleSeries/SeasonsSection";
import SinglePageLayout from "@/components/layout/singlePage/SinglePageLayout";
import SinglePageSkeleton from "@/components/layout/singlePage/SinglePageSkeleton";
import JsonLd from "@/components/seo/JsonLd";
import { notFound } from "next/navigation";
import { apiFetch } from "@/services/apiClient";
import { buildMetadata, describeTitle, posterUrl } from "@/utils/metadata";
import { breadcrumbSchema, seriesSchema } from "@/utils/structuredData";


//! same reason as the film page — this endpoint bumps the view count, so the
//! title and the page body have to share one call rather than make two
const fetchSingleSeries = cache(async (slug) => {
    const res = await apiFetch(`/series/${slug}`);
    const data = await res.json();
    if (data?.status === 404) return notFound();
    return data;
})

export const generateMetadata = async ({ params }) => {
    const { series } = await fetchSingleSeries(params.slug);
    if (!series) return buildMetadata({ title: "Series not found", index: false });

    return buildMetadata({
        title: series.title,
        description: describeTitle({ ...series, year: series.release_date, kind: "series" }),
        path: `/series/${params.slug}`,
        image: posterUrl(series.cover || series.thumbnail),
    });
};

const SingleSeries = async ({ params }) => {
    const { slug } = params;

    const { series: seriesData, pictures } = await fetchSingleSeries(slug);

    if (!seriesData || !pictures) return <SinglePageSkeleton />;

    const { _id: id, title, description, actors } = seriesData;

    return (
        <Suspense fallback={<SinglePageSkeleton />}>
            <JsonLd data={seriesSchema(seriesData)} />
            <JsonLd data={breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "TV Series", path: "/series" },
                { name: title, path: `/series/${slug}` },
            ])} />

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