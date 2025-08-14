// frontend/src/components/RetrievedContext.tsx
import React, { useState } from "react";
import { RetrievedContextItem } from "../types";

interface RetrievedContextProps {
  retrievedContext: RetrievedContextItem[];
}

const RetrievedContext: React.FC<RetrievedContextProps> = ({ retrievedContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (retrievedContext.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-white/10 pt-6 relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer hover:text-green-400 transition-all duration-200 mb-0 flex items-center text-premium-sm font-medium text-white/90 w-full text-left"
      >
        <svg 
          className={`w-4 h-4 mr-3 transition-transform duration-200 text-green-400 ${isOpen ? 'rotate-90' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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
        <div className="absolute top-full left-0 right-0 z-50 mt-4 max-h-64 overflow-y-auto space-y-3 scrollbar-premium glass-strong rounded-lg p-4 shadow-premium-lg">
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
                  <h4 className="text-premium-sm font-medium text-white truncate mb-1">
                    {item.title !== "Source Title Missing" && item.title ? (
                      item.source !== "Source URL Missing" && item.source ? (
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
                    ) : item.source !== "Source URL Missing" && item.source ? (
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
                      <div className="glass px-2 py-1 rounded border-green-400/20">
                        <span className="text-xs text-green-400 font-medium">
                          Similarity: {(1 - item.min_distance).toFixed(3)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-premium-sm text-white/70 leading-relaxed line-clamp-2">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetrievedContext;