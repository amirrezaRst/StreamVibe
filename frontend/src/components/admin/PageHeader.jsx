import Link from "next/link";

/**
 * Every console page opens the same way: where you are, what you are looking
 * at, and what you can do about it. The crumb is what makes a nested page —
 * a hall inside a cinema — findable a level up.
 */
const PageHeader = ({ crumbs = [], title, subtitle, children }) => (
    <>
        <header className="flex items-center gap-3.5 py-2.5 px-[18px] border-b border-c-black-15 bg-c-black-08 min-h-[45px]">
            <nav aria-label="Breadcrumb" className="text-[12.5px] text-c-grey-60 flex items-center gap-[7px] min-w-0">
                {crumbs.map(crumb => (
                    <span key={crumb.label} className="flex items-center gap-[7px] shrink-0">
                        {crumb.href
                            ? <Link href={crumb.href} className="hover:text-c-grey-90 duration-150">{crumb.label}</Link>
                            : <span>{crumb.label}</span>}
                        <span className="text-c-black-25" aria-hidden="true">/</span>
                    </span>
                ))}
                <b className="text-c-grey-90 font-bold truncate">{title}</b>
            </nav>
        </header>

        <div className="px-[18px] pt-[18px] flex items-end gap-3.5 flex-wrap">
            <div className="min-w-0">
                <h1 className="text-lg font-extrabold tracking-[-0.015em]">{title}</h1>
                {subtitle && <p className="text-c-grey-60 text-[12.5px] mt-0.5">{subtitle}</p>}
            </div>
            {children && <div className="ms-auto flex gap-2">{children}</div>}
        </div>
    </>
);

export default PageHeader;
