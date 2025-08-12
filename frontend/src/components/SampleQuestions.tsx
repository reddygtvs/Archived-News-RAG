// frontend/src/components/SampleQuestions.tsx
import React from "react";
import { SampleQuestion } from "../types";

interface SampleQuestionsProps {
  sampleQuestions: SampleQuestion[];
  onQuestionSelect: (question: string) => void;
}

const SampleQuestions: React.FC<SampleQuestionsProps> = ({ sampleQuestions, onQuestionSelect }) => {
  return (
    <div className="mb-8" style={{ paddingTop: '8px' }}>
      <h2 className="text-lg font-semibold text-white mb-4" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.18)'}}>
        Sample Questions
      </h2>
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {[...sampleQuestions, ...sampleQuestions, ...sampleQuestions].map((q, index) => (
            <button
              key={`${q.id}-${index}`}
              onClick={() => onQuestionSelect(q.question)}
              className="ticker-item"
            >
              <div className="ticker-category">{q.category}</div>
              <div className="ticker-question">{q.question}</div>
            </button>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .ticker-wrapper {
            overflow: hidden;
            background: transparent;
            padding: 8px 0 16px 0;
          }
          
          .ticker-content {
            display: flex;
            animation: scroll-left 60s linear infinite;
            width: max-content;
          }
          
          .ticker-item {
            flex-shrink: 0;
            width: 200px;
            height: 140px;
            margin-right: 16px;
            padding: 12px;
            background: rgb(25, 25, 24);
            border: 1px solid rgb(55, 55, 53);
            border-radius: 0;
            color: rgb(238, 238, 236);
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            position: relative;
          }
          
          .ticker-item:hover {
            background: rgb(39, 39, 37);
            border-color: rgb(75, 75, 73);
            transform: translateY(-2px);
          }
          
          .ticker-category {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #39ff14;
          }
          
          .ticker-question {
            font-size: 14px;
            line-height: 1.3;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: calc(100% - 24px);
          }
          
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
        `
      }} />
    </div>
  );
};

export default SampleQuestions;