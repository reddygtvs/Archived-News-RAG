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
    <div className="mb-8">
      <form onSubmit={onSubmit} className="flex justify-center">
        <div className="relative w-full max-w-2xl">
          <input
            type="text"
            placeholder="Pick one of the cached responses from above"
            value={query}
            onChange={onQueryChange}
            disabled={true}
            readOnly={true}
            className="w-full px-4 py-5 pr-20 text-white placeholder-gray-400 focus:outline-none cursor-not-allowed disabled:bg-gray-900"
            style={{
              backgroundColor: 'rgb(17, 17, 16)',
              border: '1px solid rgb(55, 55, 53)',
              borderRadius: '8px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{
              background: loading || !query.trim() 
                ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9))' 
                : 'linear-gradient(135deg, #39ff14, #22c55e)',
              color: loading || !query.trim() ? 'rgb(156, 163, 175)' : '#000',
              border: loading || !query.trim() ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              borderRadius: '8px',
              boxShadow: loading || !query.trim() 
                ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                : '0 4px 12px rgba(57, 255, 20, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
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
      </form>
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default QueryForm;