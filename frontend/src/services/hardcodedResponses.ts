// frontend/src/services/hardcodedResponses.ts
import { ApiResponse, RetrievedContextItem } from "../types";
import hardcodedData from "../data/hardcoded_responses.json";

interface HardcodedResponse {
  question: string;
  category: string;
  standard_response: string;
  rag_response: string;
  context: RetrievedContextItem[];
  metadata?: {
    generation_time: number;
    standard_llm_time: number;
    retrieval_time: number;
    rag_llm_time: number;
    total_llm_time: number;
    context_chars: number;
    validation: {
      has_content: boolean;
      has_citations: boolean;
      context_count: number;
      response_length: number;
      appears_relevant: boolean;
      no_error_markers: boolean;
      overall_quality: boolean;
    };
  };
}

interface HardcodedData {
  generated_at: string;
  dataset_info: {
    vectors: number;
    articles: number;
    articles_per_query: number;
    max_article_length: number;
  };
  responses: Record<string, HardcodedResponse>;
}

// Type assertion for the imported JSON
const responses = hardcodedData as HardcodedData;

/**
 * Simulates API delay for the "dark deception" effect
 * Mimics real backend processing time
 */
const simulateAPIDelay = async (): Promise<void> => {
  // Random delay between 2-4 seconds to feel realistic
  const delay = Math.random() * 2000 + 2000;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Find hardcoded response by matching the question text
 * Returns the response ID if found, null otherwise
 */
const findResponseByQuestion = (question: string): string | null => {
  for (const [id, response] of Object.entries(responses.responses)) {
    if (response.question.toLowerCase() === question.toLowerCase()) {
      return id;
    }
  }
  return null;
};

/**
 * Get hardcoded response for a given question
 * Includes fake loading delay for deception effect
 */
export const getHardcodedResponse = async (question: string): Promise<ApiResponse | null> => {
  console.log(`🎮 Dark Deception: Looking for hardcoded response for: "${question}"`);
  
  // Find the matching response
  const responseId = findResponseByQuestion(question);
  
  if (!responseId) {
    console.log(`❌ No hardcoded response found for: "${question}"`);
    return null;
  }

  const hardcodedResponse = responses.responses[responseId];
  console.log(`✅ Found hardcoded response (ID: ${responseId})`);
  console.log(`📊 Response length: ${hardcodedResponse.rag_response.length} chars`);
  console.log(`📚 Context articles: ${hardcodedResponse.context.length}`);
  
  // Simulate realistic API delay
  console.log(`⏳ Simulating API processing... (fake delay)`);
  await simulateAPIDelay();
  
  // Transform to match our API response format
  const apiResponse: ApiResponse = {
    standard_response: hardcodedResponse.standard_response,
    rag_response: hardcodedResponse.rag_response,
    retrieved_chunks: hardcodedResponse.context,
    metadata: {
      query: question,
      retrieval_time: hardcodedResponse.metadata?.retrieval_time || 0,
      llm_time: hardcodedResponse.metadata?.total_llm_time || 0,
      total_time: hardcodedResponse.metadata?.generation_time || 0,
      chunks_retrieved: hardcodedResponse.context.length,
      total_context_length: hardcodedResponse.metadata?.context_chars || 0
    }
  };

  console.log(`🎯 Returning hardcoded response for dark deception effect!`);
  return apiResponse;
};

/**
 * Get list of all available hardcoded questions
 * Useful for debugging or admin purposes
 */
export const getAvailableQuestions = (): Array<{id: string, question: string, category: string}> => {
  return Object.entries(responses.responses).map(([id, response]) => ({
    id,
    question: response.question,
    category: response.category
  }));
};

/**
 * Get dataset information
 */
export const getDatasetInfo = () => {
  return {
    ...responses.dataset_info,
    generated_at: responses.generated_at,
    total_responses: Object.keys(responses.responses).length
  };
};

// Log available responses on module load for debugging
console.log(`🎮 Dark Deception Response System Loaded:`);
console.log(`📊 Total hardcoded responses: ${Object.keys(responses.responses).length}`);
console.log(`🗄️ Dataset: ${responses.dataset_info.vectors.toLocaleString()} vectors, ${responses.dataset_info.articles.toLocaleString()} articles`);
console.log(`📅 Generated: ${responses.generated_at}`);

export default {
  getHardcodedResponse,
  getAvailableQuestions,
  getDatasetInfo
};