// frontend/src/App.tsx
import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./index.css";

const API_URL = "http://localhost:5001/api/query";

interface RetrievedContextItem {
  text: string;
  source: string;
  title: string;
  date: string;
  article_id?: string;
  min_distance?: number;
}

interface ApiResponse {
  standard_response: string;
  rag_response: string;
  retrieved_chunks: RetrievedContextItem[];
  error?: string;
}

interface SampleQuestion {
  id: string;
  question: string;
  category: string;
}

const sampleQuestions: SampleQuestion[] = [
  { id: "1", question: "What were the major political events in 2015?", category: "Politics" },
  { id: "2", question: "Tell me about climate change discussions in 2015", category: "Environment" },
  { id: "3", question: "What sports events happened in 2015?", category: "Sports" },
  { id: "4", question: "What were the biggest tech innovations in 2015?", category: "Technology" },
  { id: "5", question: "What economic events shaped 2015?", category: "Economics" },
  { id: "6", question: "What cultural movements emerged in 2015?", category: "Culture" },
  { id: "7", question: "What international conflicts occurred in 2015?", category: "World" },
  { id: "8", question: "What scientific breakthroughs happened in 2015?", category: "Science" },
  { id: "9", question: "What social issues dominated 2015?", category: "Society" },
  { id: "10", question: "What entertainment news defined 2015?", category: "Entertainment" }
];


function App() {
  const [query, setQuery] = useState<string>("");
  const [standardResponse, setStandardResponse] = useState<string>("");
  const [ragResponse, setRagResponse] = useState<string>("");
  const [retrievedContext, setRetrievedContext] = useState<
    RetrievedContextItem[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setError("Please enter a query.");
      return;
    }

    setLoading(true);
    setError("");
    setStandardResponse("");
    setRagResponse("");
    setRetrievedContext([]); // To clear previous context

    try {
      const response = await axios.post<ApiResponse>(API_URL, { query });
      setStandardResponse(response.data.standard_response);
      setRagResponse(response.data.rag_response);
      setRetrievedContext(response.data.retrieved_chunks);
    } catch (err) {
      console.error("API Error:", err);
      let errorMsg = "Failed to fetch response from backend.";
      if (axios.isAxiosError(err)) {
        errorMsg =
          err.response?.data?.error ||
          err.message ||
          "An unknown Axios error occurred.";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date string or return 'N/A'
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 pt-3 pb-3">
          <h1 
            className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest m-0 text-glow-white cursor-pointer hover:text-spotify transition-colors duration-200"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ARCHIVED NEWS RAG<span className="bounce-favicon">.</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 max-w-6xl mx-auto px-5 py-8">
        <div className="text-center mb-8">
          <p className="text-text-secondary text-lg mb-8">
            Compare responses from standard LLM vs. RAG-enhanced model using The Guardian's 2015 Archive
          </p>
        </div>

        {/* Sample Questions Carousel */}
        <div className="mb-8" style={{ paddingTop: '8px' }}>
          <h2 className="text-lg font-semibold text-white mb-4" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.18)'}}>
            Sample Questions
          </h2>
          <div className="ticker-wrapper">
            <div className="ticker-content">
              {[...sampleQuestions, ...sampleQuestions, ...sampleQuestions].map((q, index) => (
                <button
                  key={`${q.id}-${index}`}
                  onClick={() => setQuery(q.question)}
                  className="ticker-item"
                >
                  <div className="ticker-category">{q.category}</div>
                  <div className="ticker-question">{q.question}</div>
                </button>
              ))}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
              .ticker-wrapper {
                overflow: hidden;
                background: transparent;
                padding: 8px 0 16px 0;
              }
              
              .ticker-content {
                display: flex;
                animation: scroll-left 60s linear infinite;
                width: max-content;
              }
              
              .ticker-item {
                flex-shrink: 0;
                width: 280px;
                margin-right: 16px;
                padding: 16px;
                background: rgb(25, 25, 24);
                border: 1px solid rgb(55, 55, 53);
                border-radius: 8px;
                color: rgb(238, 238, 236);
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
              }
              
              .ticker-item:hover {
                background: rgb(39, 39, 37);
                border-color: rgb(75, 75, 73);
                transform: translateY(-2px);
              }
              
              .ticker-category {
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #39ff14;
              }
              
              .ticker-question {
                font-size: 14px;
                line-height: 1.4;
              }
              
              @keyframes scroll-left {
                0% { transform: translateX(0); }
                100% { transform: translateX(-33.333%); }
              }
            `
          }} />
        </div>

        {/* Query Form */}
        <div className="mb-8">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter your query about events/topics from 2015..."
                  value={query}
                  onChange={handleQueryChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-bg-primary border border-border-default rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-spotify focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full px-6 py-3 bg-spotify hover:bg-spotify-hover disabled:bg-bg-tertiary disabled:text-text-secondary text-black font-medium rounded-md transition-all duration-200 hover-press"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "Ask Question"
                )}
              </button>
            </form>
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Response Cards */}
        {(standardResponse || ragResponse || loading) && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Standard LLM Response */}
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4 text-glow-white">
                Standard LLM Response
              </h2>
              <div className="border-t border-border-default pt-4">
                <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                  {loading && !standardResponse ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-spotify border-t-transparent"></div>
                    </div>
                  ) : standardResponse ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{standardResponse}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-text-secondary">
                      No response yet or an error occurred.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RAG Response */}
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4 text-glow-white">
                RAG Response
                <span className="text-sm font-normal text-text-secondary ml-2">
                  (with 2015 News Context)
                </span>
              </h2>
              <div className="border-t border-border-default pt-4">
                <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                  {loading && !ragResponse ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-spotify border-t-transparent"></div>
                    </div>
                  ) : ragResponse ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{ragResponse}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-text-secondary">
                      No response yet or an error occurred.
                    </p>
                  )}
                </div>
                
                {/* Retrieved Context Section */}
                {retrievedContext.length > 0 && (
                  <div className="mt-6 border-t border-border-default pt-4">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-text-primary hover:text-white transition-colors mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        References ({retrievedContext.length} source{retrievedContext.length !== 1 ? "s" : ""})
                      </summary>
                      <div className="max-h-64 overflow-y-auto space-y-3 scrollbar-thin">
                        {retrievedContext.map((item, index) => (
                          <div
                            key={item.article_id || index}
                            className="bg-bg-primary border border-border-default rounded-md p-3"
                          >
                            <div className="text-sm font-medium text-white mb-2">
                              <span className="text-spotify mr-2">[{index + 1}]</span>
                              {item.title !== "Source Title Missing" && item.title ? (
                                item.source !== "Source URL Missing" && item.source ? (
                                  <a
                                    href={item.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-primary hover:text-spotify transition-colors animated-underline"
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
                                  className="text-text-primary hover:text-spotify transition-colors animated-underline"
                                >
                                  {item.source}
                                </a>
                              ) : (
                                `Retrieved Article ${index + 1}`
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="inline-block px-2 py-1 bg-bg-tertiary text-xs text-text-secondary rounded">
                                Date: {formatDate(item.date)}
                              </span>
                              {typeof item.min_distance === "number" && (
                                <span className="inline-block px-2 py-1 bg-bg-tertiary text-xs text-text-secondary rounded">
                                  Score: {item.min_distance.toFixed(4)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary max-h-16 overflow-y-auto">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
