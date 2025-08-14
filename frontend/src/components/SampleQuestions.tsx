// frontend/src/components/SampleQuestions.tsx
import React from "react";
import { SampleQuestion } from "../types";

interface SampleQuestionsProps {
  sampleQuestions: SampleQuestion[];
  additionalQuestions: SampleQuestion[];
  onQuestionSelect: (question: string) => void;
}

const SampleQuestions: React.FC<SampleQuestionsProps> = ({
  sampleQuestions,
  additionalQuestions,
  onQuestionSelect,
}) => {
  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-premium-xl md:text-premium-2xl font-semibold text-white tracking-tight">
          <span className="text-white/90">Sample</span>{" "}
          <span className="text-gradient-green">Queries</span>
        </h2>
        <p className="text-premium-sm text-white/60 max-w-md mx-auto">
          Click any query to get started
        </p>
      </div>

      {/* First scroller - left to right */}
      <div className="premium-ticker-wrapper">
        <div className="premium-ticker-content">
          {sampleQuestions.concat(sampleQuestions).map((q, index) => (
            <button
              key={`primary-${q.id}-${index}`}
              onClick={() => onQuestionSelect(q.question)}
              className="premium-ticker-item hover-lift-premium"
            >
              <div className="premium-ticker-category">{q.category}</div>
              <div className="premium-ticker-question">{q.question}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Second scroller - right to left */}
      <div className="premium-ticker-wrapper premium-ticker-wrapper-reverse">
        <div className="premium-ticker-content premium-ticker-content-reverse">
          {additionalQuestions.concat(additionalQuestions).map((q, index) => (
            <button
              key={`additional-${q.id}-${index}`}
              onClick={() => onQuestionSelect(q.question)}
              className="premium-ticker-item hover-lift-premium"
            >
              <div className="premium-ticker-category">{q.category}</div>
              <div className="premium-ticker-question">{q.question}</div>
            </button>
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .premium-ticker-wrapper {
            overflow: hidden;
            background: transparent;
            padding: 8px 0 12px 0;
            position: relative;
            width: 100vw;
            left: 50%;
            transform: translateX(-50%);
            mask-image: linear-gradient(
              90deg, 
              transparent 0%, 
              rgba(0,0,0,1) 2%, 
              rgba(0,0,0,1) 98%, 
              transparent 100%
            );
            -webkit-mask-image: linear-gradient(
              90deg, 
              transparent 0%, 
              rgba(0,0,0,1) 2%, 
              rgba(0,0,0,1) 98%, 
              transparent 100%
            );
          }
          
          .premium-ticker-content {
            display: flex;
            animation: premium-scroll-left 45s linear infinite;
            width: fit-content;
            will-change: transform;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
          
          @media (max-width: 768px) {
            .premium-ticker-content {
              animation-duration: 35s;
            }
          }
          
          @media (max-width: 480px) {
            .premium-ticker-content {
              animation-duration: 30s;
            }
          }
          
          .premium-ticker-item {
            flex-shrink: 0;
            width: 280px;
            height: 140px;
            margin-right: 16px;
            padding: 24px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
            backdrop-filter: blur(32px);
            -webkit-backdrop-filter: blur(32px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px;
            color: #ffffff;
            text-align: left;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.05),
              0 2px 8px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
          }

          .premium-ticker-item::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1px;
            background: linear-gradient(135deg, rgba(0, 210, 106, 0.4), rgba(0, 210, 106, 0.1), transparent 70%);
            border-radius: 8px;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .premium-ticker-item:hover::before {
            opacity: 1;
          }
          
          .premium-ticker-item:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
            border-color: rgba(0, 210, 106, 0.15);
            transform: translateY(-2px);
            box-shadow: 
              0 4px 8px rgba(0, 0, 0, 0.12),
              0 8px 24px rgba(0, 0, 0, 0.15),
              0 16px 48px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(0, 210, 106, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }
          
          .premium-ticker-category {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #00d26a;
            margin-bottom: 12px;
            opacity: 0.95;
            line-height: 1.2;
          }
          
          .premium-ticker-question {
            font-size: 15px;
            line-height: 1.45;
            font-weight: 500;
            color: #ffffff;
            flex: 1;
            display: flex;
            align-items: center;
            letter-spacing: -0.015em;
            opacity: 0.95;
          }
          
          .premium-ticker-wrapper-reverse {
            margin-top: -4px;
          }
          
          .premium-ticker-content-reverse {
            animation: premium-scroll-right 45s linear infinite;
          }
          
          @media (max-width: 768px) {
            .premium-ticker-content-reverse {
              animation-duration: 35s;
            }
          }
          
          @media (max-width: 480px) {
            .premium-ticker-content-reverse {
              animation-duration: 30s;
            }
          }
          
          @keyframes premium-scroll-left {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(calc(-280px * ${sampleQuestions.length} - 16px * ${sampleQuestions.length}), 0, 0); }
          }
          
          @keyframes premium-scroll-right {
            0% { transform: translate3d(calc(-280px * ${additionalQuestions.length} - 16px * ${additionalQuestions.length}), 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }

          /* Keep animations running always - no pause on hover */

          /* Ensure smooth performance across all devices */
          @media (max-width: 640px) {
            .premium-ticker-item {
              width: 260px;
              height: 130px;
              padding: 16px;
            }
            
            .premium-ticker-question {
              font-size: 14px;
            }
          }

          /* Handle very small screens */
          @media (max-width: 320px) {
            .premium-ticker-item {
              width: 240px;
              height: 120px;
              padding: 14px;
            }
          }

          /* Respect reduced motion preferences */
          @media (prefers-reduced-motion: reduce) {
            .premium-ticker-content,
            .premium-ticker-content-reverse {
              animation: none;
            }
            
            .premium-ticker-wrapper {
              overflow-x: auto;
              overflow-y: hidden;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            
            .premium-ticker-wrapper::-webkit-scrollbar {
              display: none;
            }
            
            .premium-ticker-content {
              justify-content: flex-start;
              padding: 0 20px;
            }
          }
        `,
        }}
      />
    </div>
  );
};

export default SampleQuestions;
