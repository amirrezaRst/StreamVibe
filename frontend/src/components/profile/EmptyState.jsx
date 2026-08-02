import Link from "next/link";

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionHref }) => (
    <div className="border border-dashed border-c-black-20 rounded-2xl py-10 px-6 text-center">
        <div className="w-[52px] h-[52px] rounded-full bg-c-black-10 border border-c-black-15 flex items-center justify-center mx-auto mb-4 text-c-grey-65">
            <Icon className="w-[22px] h-[22px]" />
        </div>
        <h4 className="text-c-grey-90 text-[15px] font-semibold mb-1.5">{title}</h4>
        <p className="text-c-grey-60 text-super-sm max-w-[34ch] mx-auto mb-[18px]">{description}</p>
        <Link
            href={actionHref}
            className="inline-block bg-c-red-45 hover:bg-c-red-45/85 duration-200 text-white text-super-sm font-bold rounded-lg py-2.5 px-[22px]"
        >
            {actionLabel}
        </Link>
    </div>
);

export default EmptyState;
