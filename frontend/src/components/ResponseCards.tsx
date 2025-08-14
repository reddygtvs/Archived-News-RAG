// frontend/src/components/ResponseCards.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import { RetrievedContextItem } from "../types";
import RetrievedContext from "./RetrievedContext";

interface ResponseCardsProps {
  standardResponse: string;
  ragResponse: string;
  retrievedContext: RetrievedContextItem[];
  loading: boolean;
}

const ResponseCards: React.FC<ResponseCardsProps> = ({ 
  standardResponse, 
  ragResponse, 
  retrievedContext, 
  loading 
}) => {
  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full max-w-full lg:items-start">
      {/* Standard LLM Response */}
      <div className="rounded-lg p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] flex flex-col w-full overflow-x-hidden" style={{background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'}}>
        <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0" style={{boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'}}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-white"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16-.21 2.31-.48 3.38-.84"/>
              <path d="M22 12c0 1.38-.35 2.68-.97 3.82"/>
              <path d="M19 16l-3-3 1.5-1.5L19 13l4-4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-premium-sm sm:text-premium-base font-semibold text-white" style={{letterSpacing: '-0.025em'}}>
              Standard Response
            </h2>
            <p className="text-[10px] sm:text-premium-xs text-white/65 font-medium" style={{letterSpacing: '-0.01em'}}>
              General knowledge without context
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-4 sm:pt-6 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-premium">
            {loading && !standardResponse ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                  <span className="text-[10px] sm:text-premium-xs text-white/70 font-medium">
                    Generating response...
                  </span>
                </div>
              </div>
            ) : standardResponse ? (
              <div className="prose-premium">
                <ReactMarkdown>{standardResponse}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="w-12 h-12 rounded glass flex items-center justify-center mb-4 mx-auto">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      className="text-white/40"
                    >
                      <path d="M8 12h8"/>
                      <path d="M12 8v8"/>
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-premium-xs text-white/60 font-medium">
                    No response available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RAG Response */}
      <div className="rounded-lg p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] flex flex-col w-full overflow-x-hidden" style={{background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(0, 210, 106, 0.08)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 210, 106, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.03)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'}}>
        <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0" style={{boxShadow: '0 2px 4px rgba(0, 210, 106, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'}}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-white"
            >
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 1.38-.35 2.68-.97 3.82a10.02 10.02 0 01-2.31 3.1 10.02 10.02 0 01-3.1 2.31c-1.14.62-2.44.97-3.82.97-1.38 0-2.68-.35-3.82-.97a10.02 10.02 0 01-3.1-2.31A10.02 10.02 0 013 15.82 10.02 10.02 0 012 12c0-1.38.35-2.68.97-3.82a10.02 10.02 0 012.31-3.1A10.02 10.02 0 018.38 2.03C9.52 1.41 10.82 1.06 12.2 1.06c1.38 0 2.68.35 3.82.97"/>
            </svg>
          </div>
          <div>
            <h2 className="text-premium-sm sm:text-premium-base font-semibold text-white" style={{letterSpacing: '-0.025em'}}>
              RAG-Enhanced Response
            </h2>
            <p className="text-[10px] sm:text-premium-xs text-green-400/90 font-medium" style={{letterSpacing: '-0.01em'}}>
              With 2015 news context
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-4 sm:pt-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-premium mb-4 sm:mb-6">
            {loading && !ragResponse ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                  <span className="text-[10px] sm:text-premium-xs text-white/70 font-medium">
                    Retrieving context...
                  </span>
                </div>
              </div>
            ) : ragResponse ? (
              <div className="prose-premium">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => {
                      const processText = (text: string) => {
                        if (typeof text !== 'string') return text;
                        
                        const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
                        return parts.map((part, index) => {
                          const match = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/);
                          if (match) {
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  const referencesSection = document.querySelector('details');
                                  if (referencesSection) {
                                    referencesSection.open = true;
                                    referencesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                  }
                                }}
                                className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors cursor-pointer font-medium"
                                style={{ 
                                  fontSize: 'inherit', 
                                  background: 'linear-gradient(135deg, rgba(0, 210, 106, 0.08), rgba(0, 210, 106, 0.12))', 
                                  border: '1px solid rgba(0, 210, 106, 0.15)',
                                  borderRadius: '3px',
                                  padding: '2px 5px',
                                  margin: '0 1px',
                                  backdropFilter: 'blur(8px)',
                                  boxShadow: 'inset 0 1px 0 rgba(0, 210, 106, 0.1)'
                                }}
                              >
                                {part}
                              </button>
                            );
                          }
                          return part;
                        });
                      };

                      const processChildren = (children: any): any => {
                        if (typeof children === 'string') {
                          return processText(children);
                        }
                        if (Array.isArray(children)) {
                          return children.map((child) => 
                            typeof child === 'string' ? processText(child) : child
                          );
                        }
                        return children;
                      };

                      return <p>{processChildren(children)}</p>;
                    }
                  }}
                >
                  {ragResponse}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="w-12 h-12 rounded glass flex items-center justify-center mb-4 mx-auto">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      className="text-white/40"
                    >
                      <path d="M8 12h8"/>
                      <path d="M12 8v8"/>
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-premium-xs text-white/60 font-medium">
                    No response available
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <RetrievedContext retrievedContext={retrievedContext} />
        </div>
      </div>
    </div>
  );
};

export default ResponseCards;