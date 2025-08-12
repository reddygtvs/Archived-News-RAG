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
    <div className="grid md:grid-cols-2 gap-6">
      {/* Standard LLM Response */}
      <div style={{backgroundColor: 'rgb(25, 25, 24)', border: '1px solid rgb(55, 55, 53)', height: '700px'}} className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.18)'}}>
          Standard LLM Response
        </h2>
        <div className="border-t pt-4" style={{borderColor: 'rgb(55, 55, 53)', height: 'calc(100% - 60px)'}}>
          <div style={{height: '100%'}} className="overflow-y-auto pr-2 scrollbar-thin">
            {loading && !standardResponse ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400 border-t-transparent"></div>
              </div>
            ) : standardResponse ? (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{standardResponse}</ReactMarkdown>
              </div>
            ) : (
              <p style={{color: 'rgb(181, 179, 173)'}}>
                No response yet or an error occurred.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RAG Response */}
      <div style={{backgroundColor: 'rgb(25, 25, 24)', border: '1px solid rgb(55, 55, 53)', height: '700px'}} className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.18)'}}>
          RAG Response
          <span className="text-sm font-normal ml-2" style={{color: 'rgb(181, 179, 173)'}}>
            (with 2015 News Context)
          </span>
        </h2>
        <div className="border-t pt-4" style={{borderColor: 'rgb(55, 55, 53)', height: 'calc(100% - 60px)'}}>
          <div style={{height: '60%'}} className="overflow-y-auto pr-2 scrollbar-thin">
            {loading && !ragResponse ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400 border-t-transparent"></div>
              </div>
            ) : ragResponse ? (
              <div className="prose prose-invert max-w-none">
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
                                className="inline text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                                style={{ fontSize: 'inherit', background: 'none', border: 'none', padding: 0 }}
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
              <p style={{color: 'rgb(181, 179, 173)'}}>
                No response yet or an error occurred.
              </p>
            )}
          </div>
          
          <RetrievedContext retrievedContext={retrievedContext} />
        </div>
      </div>
    </div>
  );
};

export default ResponseCards;