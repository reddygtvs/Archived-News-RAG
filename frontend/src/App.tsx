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
    <div className="min-h-screen" style={{backgroundColor: '#0d0d0d'}}>
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
                width: 200px;
                height: 140px;
                margin-right: 16px;
                padding: 12px;
                background: rgb(25, 25, 24);
                border: 1px solid rgb(55, 55, 53);
                border-radius: 0;
                color: rgb(238, 238, 236);
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                position: relative;
              }
              
              .ticker-item:hover {
                background: rgb(39, 39, 37);
                border-color: rgb(75, 75, 73);
                transform: translateY(-2px);
              }
              
              .ticker-category {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #39ff14;
              }
              
              .ticker-question {
                font-size: 14px;
                line-height: 1.3;
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: calc(100% - 24px);
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
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter your query about events/topics from 2015..."
                  value={query}
                  onChange={handleQueryChange}
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

        {/* Response Cards */}
        {(standardResponse || ragResponse || loading) && (
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
                            // Convert reference numbers like [1] to clickable links
                            const processText = (text: string) => {
                              if (typeof text !== 'string') return text;
                              
                              // Handle multiple references like [8, 12, 16] and single references like [1]
                              const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
                              return parts.map((part, index) => {
                                const match = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/);
                                if (match) {
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        // Scroll to references section
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
                                return children.map((child, index) => 
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
                
                {/* Retrieved Context Section */}
                {retrievedContext.length > 0 && (
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
