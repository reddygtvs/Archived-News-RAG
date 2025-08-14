// frontend/src/components/QueryForm.tsx
import React, { FormEvent, ChangeEvent } from "react";

interface QueryFormProps {
  query: string;
  loading: boolean;
  error: string;
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const QueryForm: React.FC<QueryFormProps> = ({ 
  query, 
  loading, 
  error, 
  onQueryChange, 
  onSubmit 
}) => {
  return (
    <div className="mb-16">
      <form onSubmit={onSubmit} className="flex justify-center">
        <div className="relative w-full max-w-3xl">
          <div className="glass-strong rounded-2xl p-2 shadow-premium-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="Select a sample query above to get started..."
                value={query}
                onChange={onQueryChange}
                disabled={true}
                readOnly={true}
                className="w-full h-14 px-6 pr-20 text-premium-base text-white placeholder-white/40 bg-transparent border-0 focus:outline-none cursor-not-allowed disabled:opacity-70 rounded-xl"
                style={{
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em'
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: loading || !query.trim() 
                    ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9))' 
                    : 'linear-gradient(135deg, #00d26a, #00b359)',
                  color: loading || !query.trim() ? 'rgb(156, 163, 175)' : '#000',
                  border: loading || !query.trim() ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  borderRadius: '8px',
                  boxShadow: loading || !query.trim() 
                    ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                    : '0 4px 12px rgba(0, 210, 106, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                ) : (
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>▶</span>
                )}
              </button>
            </div>
          </div>
          
          {/* Enhanced floating helper text */}
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-premium-sm text-white/50 font-medium">
                Click any sample query to explore
              </span>
            </div>
          </div>
        </div>
      </form>
      
      {error && (
        <div className="mt-6 max-w-3xl mx-auto">
          <div className="glass border-red-500/20 bg-red-500/5 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-premium-sm font-semibold text-red-400 mb-1">
                  Something went wrong
                </h3>
                <p className="text-premium-sm text-red-300/80 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryForm;