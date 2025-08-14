// frontend/src/types/index.ts
export interface RetrievedContextItem {
  text: string;
  source: string;
  title: string;
  date: string;
  article_id?: string;
  min_distance?: number;
}

export interface ApiResponse {
  standard_response: string;
  rag_response: string;
  retrieved_chunks: RetrievedContextItem[];
  error?: string;
  metadata?: {
    query: string;
    retrieval_time: number;
    llm_time: number;
    total_time: number;
    chunks_retrieved: number;
    total_context_length: number;
  };
}

export interface SampleQuestion {
  id: string;
  question: string;
  category: string;
}
