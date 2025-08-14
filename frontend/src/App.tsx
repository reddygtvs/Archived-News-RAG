// frontend/src/App.tsx
import { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import "./index.css";
import { ApiResponse, RetrievedContextItem } from "./types";
import { sampleQuestions, additionalQuestions } from "./data/sampleQuestions";
import Header from "./components/Header";
import SampleQuestions from "./components/SampleQuestions";
import QueryForm from "./components/QueryForm";
import ResponseCards from "./components/ResponseCards";

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

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0d0d0d'}}>
      <Header />
      
      <main className="pt-20 max-w-6xl mx-auto px-5 py-8">
        <div className="text-center mb-16 py-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{textShadow: '0 0 30px rgba(57, 255, 20, 0.4)'}}>
            Compare AI Responses
          </h1>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-4">
            Experience the difference between standard LLM and RAG-enhanced responses using
          </p>
          <span 
            className="text-2xl font-bold text-green-400"
            style={{
              background: 'linear-gradient(90deg, #7dd3fc, #4ade80, #22c55e, #10b981, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}
          >
            The Guardian's 2015 Archive
          </span>
        </div>

        <SampleQuestions 
          sampleQuestions={sampleQuestions}
          additionalQuestions={additionalQuestions}
          onQuestionSelect={handleQuestionSelect}
        />

        <QueryForm
          query={query}
          loading={loading}
          error={error}
          onQueryChange={handleQueryChange}
          onSubmit={handleSubmit}
        />

        {(standardResponse || ragResponse || loading) && (
          <ResponseCards
            standardResponse={standardResponse}
            ragResponse={ragResponse}
            retrievedContext={retrievedContext}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

export default App;
