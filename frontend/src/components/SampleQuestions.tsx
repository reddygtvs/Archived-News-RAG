// frontend/src/components/SampleQuestions.tsx
import React from "react";
import { SampleQuestion } from "../types";

interface SampleQuestionsProps {
  sampleQuestions: SampleQuestion[];
  additionalQuestions: SampleQuestion[];
  onQuestionSelect: (question: string) => void;
}

const SampleQuestions: React.FC<SampleQuestionsProps> = ({ sampleQuestions, additionalQuestions, onQuestionSelect }) => {
  return (
    <div className="mb-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center px-6 py-3 rounded-full backdrop-blur-md border border-white/10" 
             style={{
               background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9))',
               boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
             }}>
          <div className="w-2 h-2 rounded-full mr-3" 
               style={{
                 background: 'linear-gradient(90deg, #39ff14, #22c55e)',
                 boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)'
               }}></div>
          <span className="text-sm font-medium text-white/90 uppercase tracking-widest">
            Explore Sample Queries
          </span>
        </div>
      </div>
      
      {/* First scroller - left to right */}
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {[...sampleQuestions, ...sampleQuestions].map((q, index) => (
            <button
              key={`primary-${q.id}-${index}`}
              onClick={() => onQuestionSelect(q.question)}
              className="ticker-item"
            >
              <div className="ticker-category">{q.category}</div>
              <div className="ticker-question">{q.question}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Second scroller - right to left */}
      <div className="ticker-wrapper ticker-wrapper-reverse">
        <div className="ticker-content ticker-content-reverse">
          {[...additionalQuestions, ...additionalQuestions].map((q, index) => (
            <button
              key={`additional-${q.id}-${index}`}
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
            position: relative;
            width: 100vw;
            left: 50%;
            transform: translateX(-50%);
          }
          
          .ticker-content {
            display: flex;
            animation: scroll-left 40s linear infinite;
            width: 5200px;
            will-change: transform;
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
          
          @media (max-width: 768px) {
            .ticker-content {
              animation-duration: 30s;
            }
          }
          
          .ticker-item {
            flex-shrink: 0;
            width: 240px;
            height: 160px;
            margin-right: 20px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.98));
            border: 1px solid transparent;
            border-radius: 12px;
            color: rgb(245, 245, 245);
            text-align: left;
            cursor: pointer;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            position: relative;
            backdrop-filter: blur(10px);
            box-shadow: 
              0 4px 20px rgba(0, 0, 0, 0.3),
              0 1px 3px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            overflow: hidden;
          }

          .ticker-item::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1px;
            background: linear-gradient(135deg, rgba(57, 255, 20, 0.3), rgba(20, 184, 166, 0.3), rgba(99, 102, 241, 0.2));
            border-radius: 12px;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.15s ease;
          }
          
          .ticker-item:hover::before {
            opacity: 1;
          }
          
          .ticker-item:hover {
            background: linear-gradient(135deg, rgba(40, 40, 40, 0.98), rgba(25, 25, 25, 1));
            transform: translateY(-4px) scale(1.01);
            box-shadow: 
              0 8px 40px rgba(0, 0, 0, 0.4),
              0 4px 20px rgba(57, 255, 20, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
          }
          
          .ticker-category {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: linear-gradient(90deg, #39ff14, #22c55e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            opacity: 0.9;
          }
          
          .ticker-question {
            font-size: 18px;
            line-height: 1.4;
            position: absolute;
            top: 55%;
            transform: translateY(-50%);
            width: calc(100% - 40px);
            font-weight: 400;
            color: rgba(245, 245, 245, 0.95);
          }
          
          .ticker-wrapper-reverse {
            margin-top: 24px;
          }
          
          .ticker-content-reverse {
            animation: scroll-right 40s linear infinite;
          }
          
          @media (max-width: 768px) {
            .ticker-content-reverse {
              animation-duration: 30s;
            }
          }
          
          @keyframes scroll-left {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-2600px, 0, 0); }
          }
          
          @keyframes scroll-right {
            0% { transform: translate3d(-2600px, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
        `
      }} />
    </div>
  );
};

export default SampleQuestions;