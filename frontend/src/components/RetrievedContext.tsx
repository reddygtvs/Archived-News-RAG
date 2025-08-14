// frontend/src/components/RetrievedContext.tsx
import React, { useState } from "react";
import { RetrievedContextItem } from "../types";

interface RetrievedContextProps {
  retrievedContext: RetrievedContextItem[];
}

const RetrievedContext: React.FC<RetrievedContextProps> = ({
  retrievedContext,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (retrievedContext.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full mt-4 sm:mt-6" data-source-references>
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full max-w-full">
        {/* Empty first column to maintain grid layout */}
        <div className="hidden lg:block"></div>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow:
              "0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
          }}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer hover:text-green-400 transition-all duration-200 mb-4 flex items-center text-premium-sm sm:text-premium-base font-medium text-white w-full text-left"
          >
            <svg
              className={`w-4 h-4 mr-3 transition-transform duration-200 text-green-400 ${
                isOpen ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="flex items-center space-x-2">
              <span>Source References</span>
              <div className="glass px-2 py-1 rounded-full">
                <span className="text-xs font-semibold text-green-400">
                  {retrievedContext.length}
                </span>
              </div>
            </span>
          </button>

          {isOpen && (
            <div className="relative">
              <div 
                className="max-h-80 overflow-y-auto scrollbar-premium space-y-3"
                style={{
                  mask: 'linear-gradient(180deg, transparent 0%, black 15%, black 85%, transparent 100%)',
                  WebkitMask: 'linear-gradient(180deg, transparent 0%, black 15%, black 85%, transparent 100%)'
                }}
              >
                {retrievedContext.map((item, index) => (
                <div
                  key={item.article_id || index}
                  className="glass rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-green-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-black">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-premium-sm font-medium text-white mb-2 line-clamp-2">
                        {item.title !== "Source Title Missing" && item.title ? (
                          item.source !== "Source URL Missing" &&
                          item.source ? (
                            <a
                              href={item.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-green-400 transition-colors"
                            >
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )
                        ) : item.source !== "Source URL Missing" &&
                          item.source ? (
                          <a
                            href={item.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-green-400 transition-colors"
                          >
                            {item.source}
                          </a>
                        ) : (
                          `Retrieved Article ${index + 1}`
                        )}
                      </h4>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <div className="glass px-2 py-1 rounded">
                          <span className="text-xs text-white/70">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        {typeof item.min_distance === "number" && (
                          <div className="glass px-2 py-1 rounded border border-green-400/20">
                            <span className="text-xs text-green-400 font-medium">
                              Similarity: {(1 - item.min_distance).toFixed(3)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-premium-xs text-white/70 leading-relaxed line-clamp-3 pl-9">
                    {item.text}
                  </p>
                </div>
              ))}
              </div>
              {/* Fade overlays for Source References */}
              <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10" style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.015) 30%, transparent 100%)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)'
              }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10" style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.015) 30%, transparent 100%)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)'
              }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetrievedContext;
