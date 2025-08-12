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
      <form onSubmit={onSubmit}>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter your query about events/topics from 2015..."
            value={query}
            onChange={onQueryChange}
            disabled={loading}
            className="flex-1 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            style={{
              backgroundColor: 'rgb(17, 17, 16)',
              border: '1px solid rgb(55, 55, 53)'
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-3 font-medium transition-all duration-200 hover-press"
            style={{
              backgroundColor: loading || !query.trim() ? 'rgb(39, 39, 37)' : '#39ff14',
              color: loading || !query.trim() ? 'rgb(156, 163, 175)' : '#000',
              border: 'none'
            }}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
              </div>
            ) : (
              "Ask"
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