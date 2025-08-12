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
        <div style={{height: 'calc(100% - 50px)', maxHeight: '200px'}} className="overflow-y-auto space-y-3 scrollbar-thin">
          {retrievedContext.map((item, index) => (
            <div
              key={item.article_id || index}
              className="border p-3"
              style={{backgroundColor: 'rgb(17, 17, 16)', borderColor: 'rgb(55, 55, 53)'}}
            >
              <div className="text-sm font-medium text-white mb-2">
                <span className="mr-2" style={{color: '#39ff14'}}>[{index + 1}]</span>
                {item.title !== "Source Title Missing" && item.title ? (
                  item.source !== "Source URL Missing" && item.source ? (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-400 transition-colors animated-underline"
                      style={{color: 'rgb(238, 238, 236)'}}
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
                    className="hover:text-green-400 transition-colors animated-underline"
                    style={{color: 'rgb(238, 238, 236)'}}
                  >
                    {item.source}
                  </a>
                ) : (
                  `Retrieved Article ${index + 1}`
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="inline-block px-2 py-1 text-xs rounded" style={{backgroundColor: 'rgb(39, 39, 37)', color: 'rgb(181, 179, 173)'}}>
                  Date: {formatDate(item.date)}
                </span>
                {typeof item.min_distance === "number" && (
                  <span className="inline-block px-2 py-1 text-xs rounded" style={{backgroundColor: 'rgb(39, 39, 37)', color: 'rgb(181, 179, 173)'}}>
                    Score: {item.min_distance.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-xs max-h-16 overflow-y-auto" style={{color: 'rgb(181, 179, 173)'}}>
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