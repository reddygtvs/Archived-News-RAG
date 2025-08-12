// frontend/src/components/RetrievedContext.tsx
import React from "react";
import { RetrievedContextItem } from "../types";

interface RetrievedContextProps {
  retrievedContext: RetrievedContextItem[];
}

const RetrievedContext: React.FC<RetrievedContextProps> = ({ retrievedContext }) => {
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
    <div className="mt-4 border-t pt-4" style={{borderColor: 'rgb(55, 55, 53)', height: '35%'}}>
      <details className="group h-full">
        <summary className="cursor-pointer text-sm font-medium hover:text-white transition-colors mb-3 flex items-center" style={{color: 'rgb(238, 238, 236)'}}>
          <svg className="w-4 h-4 mr-2 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          References ({retrievedContext.length} source{retrievedContext.length !== 1 ? "s" : ""})
        </summary>
        <div style={{height: 'calc(100% - 50px)', maxHeight: '200px'}} className="overflow-y-auto space-y-2 scrollbar-thin">
          {retrievedContext.map((item, index) => (
            <div
              key={item.article_id || index}
              className="border p-3 transition-all duration-150"
              style={{
                background: 'linear-gradient(135deg, rgba(25, 25, 25, 0.9), rgba(20, 20, 20, 0.95))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="text-xs font-medium text-white mb-2">
                <span className="mr-2 text-xs px-1.5 py-0.5 rounded" style={{
                  background: 'linear-gradient(90deg, #39ff14, #22c55e)',
                  color: '#000',
                  fontWeight: '600'
                }}>[{index + 1}]</span>
                {item.title !== "Source Title Missing" && item.title ? (
                  item.source !== "Source URL Missing" && item.source ? (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-400 transition-colors"
                      style={{color: 'rgb(238, 238, 236)', textDecoration: 'none'}}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
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
                    style={{color: 'rgb(238, 238, 236)', textDecoration: 'none'}}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {item.source}
                  </a>
                ) : (
                  `Retrieved Article ${index + 1}`
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="inline-block px-2 py-0.5 text-xs rounded" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgb(200, 200, 200)',
                  fontSize: '10px'
                }}>
                  {formatDate(item.date)}
                </span>
                {typeof item.min_distance === "number" && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded" style={{
                    background: 'rgba(57, 255, 20, 0.1)',
                    color: '#39ff14',
                    fontSize: '10px'
                  }}>
                    {item.min_distance.toFixed(3)}
                  </span>
                )}
              </div>
              <p className="text-xs max-h-12 overflow-y-auto leading-relaxed" style={{
                color: 'rgb(190, 190, 190)',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default RetrievedContext;