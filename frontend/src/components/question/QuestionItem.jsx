import { MinusSvg, PlusSvg } from "@/assets/Svgs";

const QuestionItem = ({ handleClick, openId, id, question, answer }) => {
    return (
        <div key={id} className="mb-3.5">
            <div className="flex items-center justify-between gap-3.5 mb-5">
                <div className="3xl:w-16 3xl:h-16 w-10 h-10 rounded-lg bg-c-black-12 border border-c-black-15 flex items-center justify-center text-white 3xl:text-2xl md:text-base text-super font-semibold">
                    {String(id).padStart(2, '0')}
                </div>
                <div className="flex flex-1 flex-col justify-center items-start">
                    <h6
                        className="text-white/85 3xl:text-xl lg:text-super-sm text-super-xs line-clamp-1 mb-2 cursor-pointer"
                        onClick={() => handleClick(id)}
                    >
                        {question}
                    </h6>
                    <p
                        className={`text-c-grey-60 text-super-sm overflow-hidden transition-all duration-300
                            ${openId === id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        {answer}
                    </p>
                </div>
                {/*//! aria-expanded is what tells a screen reader the answer
                    below is open — the plus/minus icon says it to everybody
                    else and to nobody using one */}
                <button
                    type="button"
                    onClick={() => handleClick(id)}
                    aria-expanded={openId === id}
                    aria-label={openId === id ? `Hide the answer to: ${question}` : `Show the answer to: ${question}`}
                    className="focus:outline-none"
                >
                    {openId === id ? <MinusSvg className="3xl:w-[35px] 3xl:h-[35px]" aria-hidden="true" /> :
                        <PlusSvg className="3xl:w-[35px] 3xl:h-[35px]" aria-hidden="true" />
                    }
                </button>
            </div>
            <div className="w-full h-[1px] bg-gradient-to-r from-c-red-45/0 via-c-red-45/60 to-c-red-45/0"></div>
        </div>
    );
}

export default QuestionItem;