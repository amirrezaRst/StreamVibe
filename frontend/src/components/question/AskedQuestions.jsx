"use client";

import { useState } from 'react';

import QuestionTitle from "./QuestionTitle";
import QuestionItem from './QuestionItem';
import { questions } from '../../constants/questions';
import DialogModal from '../modal/DialogModal';
import QuestionForm from './QuestionForm';
import useUserStore from '@/stores/useUserStore';


const AskedQuestions = () => {
    const [openId, setOpenId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const user = useUserStore((state) => state.user);


    const handleClick = (id) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section id="faq" className="container mt-16 scroll-mt-24">
            <QuestionTitle setIsOpen={setIsOpen} />
            <div className="grid md:grid-cols-2 gap-x-10 md:mt-8 mt-10">
                {questions.map(({ id, question, answer }) => (
                    <QuestionItem
                        key={id}
                        handleClick={handleClick}
                        openId={openId}
                        id={id}
                        question={question}
                        answer={answer}
                    />
                ))}
            </div>
            <DialogModal user={user} isOpen={isOpen} setIsOpen={setIsOpen} title={"Ask a New Question"} >
                <QuestionForm />
            </DialogModal>
        </section>
    );
};

export default AskedQuestions;
