// frontend/src/App.tsx
import { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import "./index.css";
import { ApiResponse, RetrievedContextItem } from "./types";
import { sampleQuestions, additionalQuestions } from "./data/sampleQuestions";
import { getHardcodedResponse } from "./services/hardcodedResponses";
import SampleQuestions from "./components/SampleQuestions";
import QueryForm from "./components/QueryForm";
import ResponseCards from "./components/ResponseCards";
import RetrievedContext from "./components/RetrievedContext";

const API_URL = "http://localhost:5002/api/query";

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

  const handleQuestionSelect = (question: string) => {
    setQuery(question);
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
    setRetrievedContext([]);

    try {
      // 🎮 DARK DECEPTION: Use hardcoded responses instead of real API
      console.log("🎮 Dark Deception Mode: Using hardcoded responses");

      const hardcodedResponse = await getHardcodedResponse(query);

      if (hardcodedResponse) {
        setStandardResponse(hardcodedResponse.standard_response);
        setRagResponse(hardcodedResponse.rag_response);
        setRetrievedContext(hardcodedResponse.retrieved_chunks);
        console.log("✅ Hardcoded response loaded successfully!");
      } else {
        // Fallback to real API if no hardcoded response found
        console.log("⚠️ No hardcoded response found, falling back to real API");
        const response = await axios.post<ApiResponse>(API_URL, { query });
        setStandardResponse(response.data.standard_response);
        setRagResponse(response.data.rag_response);
        setRetrievedContext(response.data.retrieved_chunks);
      }
    } catch (err) {
      console.error("Error:", err);
      let errorMsg = "Failed to generate response.";
      if (axios.isAxiosError(err)) {
        errorMsg =
          err.response?.data?.error ||
          err.message ||
          "An unknown error occurred.";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
      // Reset query back to empty after response loads
      setQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-premium">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-7 h-7 rounded-md bg-gradient-to-br from-green-400/90 to-green-500/90 flex items-center justify-center backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0, 210, 106, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-white"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h1
                  className="text-lg font-light text-white"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  <span className="font-medium text-green-400">Archived</span>
                  <span className="text-white/90 font-light">News</span>
                </h1>
              </div>
            </div>
            <a
              href="https://github.com/reddygtvs/Archived-News-RAG"
              target="_blank"
              rel="noopener noreferrer"
              className="glass px-4 py-2.5 rounded-lg hover:border-green-400/20 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-white/70 group-hover:text-white transition-colors"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                <span
                  className="text-sm text-white/70 font-light group-hover:text-white transition-colors"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Source
                </span>
              </div>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center glass px-4 py-2 rounded-lg mb-6">
            <span className="text-premium-sm font-medium text-green-400 uppercase tracking-wider">
              Retrieval from 110K+ articles
            </span>
          </div>

          <h1 className="text-premium-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
            <span className="text-gradient-green">Intelligent</span> document
            retrieval from 2015 news archives
          </h1>

          <p className="text-premium-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
            Get detailed insights on 2015 events powered by RAG technology and
            <span className="text-green-400 font-medium block">
              The Guardian's comprehensive archive
            </span>
          </p>
        </div>

        <div className="animate-fade-up-delay-1">
          <SampleQuestions
            sampleQuestions={sampleQuestions}
            additionalQuestions={additionalQuestions}
            onQuestionSelect={handleQuestionSelect}
          />
        </div>

        <div className="animate-fade-up-delay-2">
          <QueryForm
            query={query}
            loading={loading}
            error={error}
            onQueryChange={handleQueryChange}
            onSubmit={handleSubmit}
          />
        </div>

        {(standardResponse || ragResponse || loading) && (
          <div className="animate-fade-up">
            <ResponseCards
              standardResponse={standardResponse}
              ragResponse={ragResponse}
              loading={loading}
            />

            {/* Source References Section */}
            {retrievedContext.length > 0 && (
              <div className="w-full max-w-full lg:items-start mt-4 sm:mt-6">
                <RetrievedContext retrievedContext={retrievedContext} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/3 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-green-600/4 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}

export default App;
