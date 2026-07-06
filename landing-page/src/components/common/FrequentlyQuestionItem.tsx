"use client";

import React, { useState } from 'react';
import ArrowDropdownToggle from '@/components/common/ArrowDropdownToggle';

import type { Locale } from '@/utils/getDictionary';

type FrequentlyQuestionItemProps = {
  locale: Locale;
  sectionTitle: string;
  questions: string[];
  answers: string[];
};

const FrequentlyQuestionItem = ({
  locale,
  sectionTitle,
  questions,
  answers,
}: FrequentlyQuestionItemProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="md:flex-none w-full px-6 xs:px-16 md:basis-[calc(50%-80px)] text-white md:w-[calc(50%-80px)] md:px-0 md:mx-[40px]">
      <ul>
        <div className="mb-[40px] pb-[40px] border-b-2 border-b-[#ffffff1a] text-[24px] leading-[1.33333]">
          {sectionTitle}
        </div>
        {questions.map((question, index) => (
        <li key={index} className="list-none pb-10">
          <button
            onClick={() => toggleExpanded(index)}
            className="relative flex items-center justify-between font-medium text-[18px] w-full leading-[1.33333] text-white cursor-pointer transition-opacity duration-200 tap-highlight-transparent opacity-80 hover:opacity-100"
          >
            <span>{question}</span>
            <ArrowDropdownToggle isExpanded={expandedIndex === index} locale={locale} />
          </button>
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              expandedIndex === index  ? 'max-h-[1000px]' : 'max-h-0'
            }`}
          >
            <div className="pt-4 text-[16px] text-[#6E757C] font-normal">
              {answers[index]}
            </div>
          </div>
        </li>))}
      </ul>
    </div>
  );
};

export default FrequentlyQuestionItem;