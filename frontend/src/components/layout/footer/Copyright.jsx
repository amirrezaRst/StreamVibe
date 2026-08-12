//! Terms of Use / Privacy Policy / Cookie Policy stay plain text on purpose —
//! there is no real legal content behind them yet, and linking to a blank or
//! placeholder page would be worse than not linking at all. Wire these up
//! once real policy text exists.
const Copyright = () => {
    return (
        <div className="flex md:flex-row flex-col md:items-center justify-between max-md:gap-4 text-c-grey-60 3xl:text-lg text-super-xs pt-4 border-t border-t-c-black-15">
            <p>&copy;{new Date().getFullYear()} StreamVibe, All Rights Reserved</p>
            <ul className="flex items-center divide-x divide-c-black-15 md:space-x-3 space-x-5">
                <li className="">Terms of Use</li>
                <li className="md:pl-3 pl-5">Privacy Policy</li>
                <li className="md:pl-3 pl-5">Cookie Policy</li>
            </ul>
        </div>
    );
}

export default Copyright;
