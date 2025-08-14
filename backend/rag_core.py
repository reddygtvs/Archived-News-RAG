# backend/rag_core.py
import faiss
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types
import pickle
import os
import time
import re # For parsing LLM Eval JSON
from collections import Counter
from config import (FAISS_INDEX_PATH, METADATA_PATH, EMBEDDING_MODEL_NAME,
                    RETRIEVAL_K, GEMINI_API_KEY, GEMINI_MODEL_NAME) # Base model
import logging

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__) 

ARTICLE_LOOKUP_PATH = "data/article_lookup.pkl"

# --- Constants ---
NUM_FULL_ARTICLES_TO_USE = 7 # Number of full articles to provide as context
RETRIEVE_MULTIPLIER = 2 # Retrieve initial_k = NUM_FULL_ARTICLES_TO_USE * RETRIEVE_MULTIPLIER chunks
EVALUATOR_LLM_MODEL_NAME = "gemini-1.5-pro-latest" # LLM for evaluation
MAX_ARTICLE_TEXT_LEN = 50000 # Character limit per article in RAG prompt context



class RAGSystem:
    """
    Implements the Retrieval-Augmented Generation system.
    Handles data loading, retrieval, generation with a base LLM,
    and optionally evaluates responses using a more powerful LLM.
    """
    def __init__(self):
        """Initializes all components of the RAG system."""
        logger.info("Initializing RAG System Components...")
        if not GEMINI_API_KEY:
            logger.error("CRITICAL: GOOGLE_API_KEY not found in environment variables.")
            raise ValueError("GOOGLE_API_KEY is missing.")

        try:
            # Initialize the GenAI client
            self.client = genai.Client(api_key=GEMINI_API_KEY)
            logger.info("Google GenAI Client configured.")
        except Exception as e:
            logger.error(f"CRITICAL: Failed to configure Google GenAI client: {e}", exc_info=True)
            raise

        # Initialize Generator LLM (2.5 Flash)
        self.generator_llm = self._initialize_llm(GEMINI_MODEL_NAME, "Generator")

        # Initialize Evaluator LLM (Pro 1.5)
        self.evaluator_llm = self._initialize_llm(EVALUATOR_LLM_MODEL_NAME, "Evaluator")

        # Load Embedding Model
        self.embedder = self._load_embedding_model()

        # Load Article Lookup Data
        self.article_lookup = self._load_pickle_data(ARTICLE_LOOKUP_PATH, "Article Lookup")

        # Load FAISS Index
        self.index = self._load_faiss_index()

        # Load Metadata
        self.metadata = self._load_metadata()

        # To check for critical components
        if not all([self.generator_llm, self.embedder, self.article_lookup, self.index, self.metadata]):
             logger.critical("One or more critical components failed to initialize. Cannot proceed.")
             raise RuntimeError("RAGSystem failed to initialize critical components.")

        logger.info("RAG System Initialized Successfully.")

    def _initialize_llm(self, model_name: str, llm_type: str) -> dict | None:
        """Initializes a Google Generative AI model client."""
        try:
            # Store model name and client info for later use
            model_config = {
                'client': self.client,
                'model_name': model_name
            }
            logger.info(f"Loaded {llm_type} LLM: {model_name}")
            return model_config
        except Exception as e:
            logger.error(f"Failed to initialize {llm_type} LLM ({model_name}): {e}. This functionality will be unavailable.", exc_info=True)
            return None 

    def _load_embedding_model(self) -> SentenceTransformer:
        """Loads the Sentence Transformer embedding model."""
        try:
            logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
            embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
            logger.info("Embedding model loaded.")
            return embedder
        except Exception as e:
            logger.error(f"CRITICAL: Failed to load embedding model {EMBEDDING_MODEL_NAME}: {e}", exc_info=True)
            raise RuntimeError(f"Could not load embedding model: {e}")

    def _load_pickle_data(self, file_path: str, description: str) -> dict:
        """Loads data from a pickle file."""
        logger.info(f"Loading {description} from {file_path}...")
        if not os.path.exists(file_path):
            logger.error(f"CRITICAL: {description} file not found: {file_path}")
            raise FileNotFoundError(f"{description} file missing. Run build_index.py again: {file_path}")
        try:
            with open(file_path, 'rb') as f_pkl:
                data = pickle.load(f_pkl)
            logger.info(f"{description} loaded with {len(data)} items.")
            return data
        except Exception as e:
            logger.error(f"CRITICAL: Error loading {description} from {file_path}: {e}", exc_info=True)
            raise RuntimeError(f"Could not load {description} data: {e}")

    def _load_faiss_index(self) -> faiss.Index:
        """Loads the FAISS index file."""
        logger.info(f"Loading FAISS index from {FAISS_INDEX_PATH}...")
        if not os.path.exists(FAISS_INDEX_PATH):
            logger.error(f"CRITICAL: FAISS index file not found: {FAISS_INDEX_PATH}")
            raise FileNotFoundError(f"FAISS index missing. Run build_index.py again: {FAISS_INDEX_PATH}")
        try:
            index = faiss.read_index(FAISS_INDEX_PATH)
            logger.info(f"FAISS index loaded with {index.ntotal} vectors.")
            if index.ntotal == 0: logger.warning("FAISS index is empty!")
            
            # Set nprobe for IVF indexes (controls search accuracy vs speed)
            if hasattr(index, 'nprobe'):
                index.nprobe = min(32, index.nlist // 4)  # Good balance of speed/accuracy
                logger.info(f"Set FAISS nprobe to {index.nprobe} for optimized search")
            
            return index
        except Exception as e:
            logger.error(f"CRITICAL: Error loading FAISS index from {FAISS_INDEX_PATH}: {e}.", exc_info=True)
            raise RuntimeError(f"Could not load FAISS index: {e}")

    def _load_metadata(self) -> dict:
        """Loads and processes the chunk metadata file."""
        logger.info(f"Loading chunk metadata from {METADATA_PATH}...")
        if not os.path.exists(METADATA_PATH):
             logger.error(f"CRITICAL: Metadata file not found: {METADATA_PATH}")
             raise FileNotFoundError(f"Metadata file missing. Run build_index.py again: {METADATA_PATH}")
        try:
            # Load from compressed pickle format
            import pickle
            with open(METADATA_PATH, 'rb') as f:
                metadata_loaded = pickle.load(f)
                # convert to int keys, fallback to string keys if error
                try:
                    metadata_processed = {int(k): v for k, v in metadata_loaded.items()}
                    logger.info("Converted metadata keys to integers.")
                    keys_are_int = True
                except (ValueError, TypeError):
                     logger.warning("Could not convert all metadata keys to integers. Using original keys (likely strings).")
                     metadata_processed = metadata_loaded 
                     keys_are_int = False

            logger.info(f"Chunk metadata loaded for {len(metadata_processed)} chunks.")
            # Perform consistency check only if keys are confirmed integers and index exists
            if hasattr(self, 'index') and keys_are_int and self.index.ntotal != len(metadata_processed) and self.index.ntotal > 0:
                 logger.warning(f"Potential Mismatch: FAISS index size ({self.index.ntotal}) vs integer-keyed metadata count ({len(metadata_processed)}).")
            return metadata_processed
        except Exception as e:
             logger.error(f"CRITICAL: Error loading or processing chunk metadata from {METADATA_PATH}: {e}.", exc_info=True)
             raise RuntimeError(f"Could not load metadata: {e}")

    def get_article_details(self, article_id: str) -> dict | None:
        """Retrieves article details (text, title, url) from the loaded lookup."""
        return self.article_lookup.get(article_id)

    def retrieve_relevant_articles(self, query: str, k_chunks: int = NUM_FULL_ARTICLES_TO_USE * RETRIEVE_MULTIPLIER) -> tuple[list[dict], float]:
        """
        Retrieves top chunks related to the query, identifies the most relevant
        unique articles based on those chunks, fetches full details for the top articles,
        and returns the article details list along with the retrieval duration.
        """
        retrieval_start_time = time.time()
        logger.info(f"Embedding query for retrieval: '{query[:100]}...'")
        try:
             query_embedding = self.embedder.encode([query], convert_to_numpy=True).astype('float32')
        except Exception as e:
             logger.error(f"Failed to encode query: {e}", exc_info=True)
             retrieval_duration = time.time() - retrieval_start_time
             return [], retrieval_duration

        if not hasattr(self, 'index') or self.index.ntotal == 0:
             logger.error("FAISS index not loaded or empty. Cannot perform search.")
             retrieval_duration = time.time() - retrieval_start_time
             return [], retrieval_duration

        logger.info(f"Searching FAISS index (size {self.index.ntotal}) for top {k_chunks} chunks...")
        try:
            # Ensure k_chunks is not greater than the number of items in the index
            actual_k = min(k_chunks, self.index.ntotal)
            if actual_k <= 0:
                 logger.warning("No chunks to search for (k=0 or index empty).")
                 distances, indices = np.array([[]]), np.array([[]]) 
            else:
                 distances, indices = self.index.search(query_embedding, actual_k)

            logger.debug(f"FAISS search raw indices (k={actual_k}): {indices.tolist()}")
            logger.debug(f"FAISS search raw distances (k={actual_k}): {distances.tolist()}")
        except Exception as e:
            logger.error(f"Error during FAISS search: {e}", exc_info=True)
            retrieval_duration = time.time() - retrieval_start_time
            return [], retrieval_duration

        # Aggregate scores per article_id based on retrieved chunks
        article_scores = {} # {article_id: [list of distances]}
        if indices.size > 0 and indices[0].size > 0 and indices[0][0] != -1:
            for i in range(indices.shape[1]): # Iterate through retrieved chunk indices
                idx = indices[0, i]
                dist = distances[0, i]
                if idx < 0: continue # Skip potentially invalid index from FAISS

                # Try int key first, then string key for robustness
                chunk_meta = self.metadata.get(idx, self.metadata.get(str(idx)))
                if chunk_meta and isinstance(chunk_meta, dict): # Ensure it's a dictionary
                    article_id = chunk_meta.get('article_id')
                    if article_id: # Ensure article_id exists
                        if article_id not in article_scores:
                            article_scores[article_id] = []
                        article_scores[article_id].append(dist)
                    else:
                        logger.warning(f"Chunk metadata for index {idx} lacks 'article_id'.")
                else:
                    logger.warning(f"Metadata key '{idx}' not found or not a dictionary.")

        if not article_scores:
            logger.warning("No valid article IDs found from retrieved chunks.")
            retrieval_duration = time.time() - retrieval_start_time
            return [], retrieval_duration

        # Rank articles by minimum distance, then by frequency (I used number of chunks)
        ranked_articles = sorted(
            article_scores.items(),
            key=lambda item: (min(item[1]), -len(item[1]))
        )
        log_limit = min(len(ranked_articles), NUM_FULL_ARTICLES_TO_USE + 5)
        logger.info(f"Ranked Articles (Top {log_limit}) (ID, [MinDist, Count]): {[(id, (float(min(scores)), len(scores))) for id, scores in ranked_articles[:log_limit]]}")

        # Fetch full details for the top N ranked unique articles
        top_articles_data = []
        article_ids_fetched = set()
        for article_id, scores in ranked_articles:
            if len(top_articles_data) >= NUM_FULL_ARTICLES_TO_USE: break # Stop once we have enough
            if article_id in article_ids_fetched: continue 

            article_details = self.get_article_details(article_id)
            if article_details:
                 # Find publication date from the first available chunk metadata for this article
                 first_chunk_meta = None
                 for chunk_idx_key in self.metadata:
                     cm = self.metadata[chunk_idx_key]
                     if isinstance(cm, dict) and cm.get('article_id') == article_id:
                         first_chunk_meta = cm
                         break
                 pub_date = first_chunk_meta.get('publication_date') if first_chunk_meta else None

                 # Construct the article data dictionary
                 top_articles_data.append({
                    'id': article_id,
                    'title': article_details.get('title'),
                    'url': article_details.get('url'),
                    'date': article_details.get('date'),
                    'full_text': article_details.get('text'),
                    'min_distance': float(min(scores)), 
                 })
                 article_ids_fetched.add(article_id)
            else:
                 logger.warning(f"Details not found for selected article ID: {article_id} in article lookup.")

        retrieval_duration = time.time() - retrieval_start_time
        logger.info(f"Retrieval phase duration: {retrieval_duration:.4f} seconds.")
        logger.info(f"Returning details for {len(top_articles_data)} articles.")
        # Log summary of selected articles
        for i, article_data in enumerate(top_articles_data):
             log_dist = article_data.get('min_distance', -1.0)
             logger.info(f"Selected Article {i+1}: ID={article_data.get('id', 'N/A')}, Min_Dist={log_dist:.4f}, Title={article_data.get('title', 'N/A')}")

        return top_articles_data, retrieval_duration

    def _call_llm(self, llm_config, prompt: str, description: str) -> tuple[str, float]:
        """Helper function to call an LLM, handle errors, and time the call."""
        logger.info(f"Sending prompt to {description} LLM ({llm_config['model_name'] if llm_config else 'N/A'})...")
        response_text = f"Error: Failed to generate {description} response."
        llm_call_duration = 0.0
        if llm_config is None:
            logger.error(f"{description} LLM is not available.")
            return f"Error: {description} LLM not initialized.", 0.0

        start_time = time.time()
        try:
            # Configure thinking budget for 2.5 models
            config = None
            if "2.5" in llm_config['model_name']:
                config = types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disable thinking
                )
            
            response_obj = llm_config['client'].models.generate_content(
                model=llm_config['model_name'],
                contents=prompt,
                config=config
            )

            # For checking of response object structure
            if not response_obj.candidates:
                 block_reason = getattr(getattr(response_obj, 'prompt_feedback', None), 'block_reason', None)
                 logger.warning(f"{description} LLM response had no candidates. Block reason: {block_reason}")
                 response_text = f"Error: Content generation failed (no candidates){f', likely due to safety settings ({block_reason})' if block_reason else '.'}"
            elif hasattr(response_obj, 'prompt_feedback') and response_obj.prompt_feedback and response_obj.prompt_feedback.block_reason:
                 block_reason = response_obj.prompt_feedback.block_reason
                 logger.warning(f"{description} LLM blocked prompt. Reason: {block_reason}")
                 response_text = f"Error: Content generation blocked by safety settings ({block_reason})..."
            else:
                try:
                    # Access response text
                    response_text = response_obj.text
                    logger.info(f"{description} LLM response extracted successfully.")
                except (IndexError, AttributeError, TypeError) as e:
                     logger.error(f"Could not extract text from {description} LLM response structure: {e}", exc_info=True)
                     response_text = f"Error: Could not parse {description} LLM's response structure."
        except Exception as e:
            logger.error(f"Exception during {description} LLM call: {e}", exc_info=True)
            response_text = f"Error generating {description} response: {type(e).__name__}" 
        finally:
            end_time = time.time()
            llm_call_duration = end_time - start_time
            logger.info(f"LLM generate_content call duration ({description}): {llm_call_duration:.4f} seconds")
            logger.info(f"LLM generate_content call duration ({description}): {llm_call_duration:.4f} seconds")

        return response_text, llm_call_duration


    def generate_rag_response(self, query: str) -> tuple[str, list[dict], float, float, int]:
        """Generates RAG response using Generator LLM and returns response text, context info, retrieval duration, LLM duration, context length."""
        logger.info(f"--- Generating RAG Response (Full Text) using {GEMINI_MODEL_NAME} for Query: '{query[:100]}...' ---")

        # Step 1: Retrieve relevant articles and retrieval duration
        retrieved_articles, retrieval_duration = self.retrieve_relevant_articles(query)

        # Step 2: Prepare simplified context for returning (to frontend/evaluator script)
        simplified_context_for_frontend = [
             { "text": article.get("full_text", "")[:500] + "...", # Truncate for summary
               "source": article.get("url", "Source URL Missing"),
               "title": article.get("title", "Source Title Missing"),
               "date": article.get("date", "N/A"),
               "article_id": article.get("id"),
               "min_distance": article.get("min_distance")
             } for article in retrieved_articles
        ]

        # Handle case where no articles are retrieved
        if not retrieved_articles:
            logger.warning("No relevant articles found for RAG, falling back to standard response generation.")
            # Call standard generation but only return its text, keeping RAG durations accurate
            std_response_text, _ = self.generate_standard_response(query)
            return f"(No relevant 2015 articles found to augment response.)\n\n{std_response_text}", [], retrieval_duration, 0.0, 0

        # Step 3: Construct the prompt context from full article texts
        context_items = []
        total_context_chars = 0
        for i, article in enumerate(retrieved_articles):
             article_url = article.get('url', 'URL_NOT_FOUND')
             article_date = article.get('date', 'DATE_NOT_FOUND')
             source_info = f"[ARTICLE {i+1} START | URL: {article_url} | DATE: {article_date}]"
             end_info = f"[ARTICLE {i+1} END]"
             article_text = article.get('full_text', '')
             if len(article_text) > MAX_ARTICLE_TEXT_LEN:
                 logger.warning(f"Truncating article {article.get('id')} from {len(article_text)} to {MAX_ARTICLE_TEXT_LEN} chars for LLM context.")
                 article_text = article_text[:MAX_ARTICLE_TEXT_LEN] + "..."
             full_item = f"{source_info}\n{article_text}\n{end_info}"
             context_items.append(full_item)
             total_context_chars += len(full_item)
        context_str = "\n\n---\n\n".join(context_items)

        # Step 4: Define the RAG prompt for the Generator LLM
        prompt = f"""You are an AI assistant answering questions, leveraging the full text of relevant news articles published in 2015 provided in the context below.

Instructions:
1. Analyze the full text provided in the "Context" section below to answer the "Question". Each article's text is clearly marked with [ARTICLE START | URL: <URL> | DATE: <DATE>] and [ARTICLE END].
2. Synthesize information *across* the provided articles if they cover the same topic from different angles.
3. Extract specific details, names, dates, opinions, and arguments directly from the article text.
4. **Crucially: When using information from a specific article, CITE IT using numbered references like [1], [2], [3] etc. corresponding to the article numbers. For example: "According to reports [1]" or "The article states [2]".** Use clean numbered citations instead of full URLs.
5. If the provided articles are relevant but don't fully answer the question, use your general knowledge to supplement BUT explicitly state that you are adding information beyond the provided 2015 articles.
6. If the provided articles seem completely irrelevant, state that the 2015 context was not helpful and answer based on your general knowledge.
7. Answer the specific question asked comprehensively, using the depth provided by the full articles.

Context:
---
{context_str}
---

Question: {query}

Answer:"""

        # Step 5: Call the Generator LLM using the helper function
        response_text, llm_call_duration = self._call_llm(self.generator_llm, prompt, "RAG Generator")

        # Step 6: Return all collected data
        return response_text, simplified_context_for_frontend, retrieval_duration, llm_call_duration, total_context_chars

    def generate_standard_response(self, query: str) -> tuple[str, float]:
        """Generates standard response using Generator LLM and returns response text and LLM duration."""
        logger.info(f"--- Generating Standard LLM Response ({GEMINI_MODEL_NAME}) for Query: '{query[:100]}...' ---")
        # Use the helper function to make the call
        response_text, llm_call_duration = self._call_llm(self.generator_llm, query, "Standard Generator")
        return response_text, llm_call_duration

    def generate_combined_responses(self, query: str) -> tuple[str, str, list[dict], float, float, int]:
        """Generates both standard and RAG responses in a single LLM call for better performance."""
        logger.info(f"--- Generating Combined Responses using {GEMINI_MODEL_NAME} for Query: '{query[:100]}...' ---")
        
        # Step 1: Retrieve relevant articles and retrieval duration
        retrieved_articles, retrieval_duration = self.retrieve_relevant_articles(query)
        
        # Step 2: Prepare simplified context for returning (to frontend/evaluator script)
        simplified_context_for_frontend = [
             { "text": article.get("full_text", "")[:500] + "...", # Truncate for summary
               "source": article.get("url", "Source URL Missing"),
               "title": article.get("title", "Source Title Missing"),
               "date": article.get("date", "N/A"),
               "article_id": article.get("id"),
               "min_distance": article.get("min_distance")
             } for article in retrieved_articles
        ]
        
        # Handle case where no articles are retrieved
        if not retrieved_articles:
            logger.warning("No relevant articles found for RAG, falling back to standard response generation.")
            std_response_text, llm_duration = self.generate_standard_response(query)
            return std_response_text, f"(No relevant 2015 articles found to augment response.)\n\n{std_response_text}", [], retrieval_duration, llm_duration, 0
        
        # Step 3: Construct the prompt context from full article texts
        context_items = []
        total_context_chars = 0
        for i, article in enumerate(retrieved_articles):
             article_url = article.get('url', 'URL_NOT_FOUND')
             article_date = article.get('date', 'DATE_NOT_FOUND')
             source_info = f"[ARTICLE {i+1} START | URL: {article_url} | DATE: {article_date}]"
             end_info = f"[ARTICLE {i+1} END]"
             article_text = article.get('full_text', '')
             if len(article_text) > MAX_ARTICLE_TEXT_LEN:
                 logger.warning(f"Truncating article {article.get('id')} from {len(article_text)} to {MAX_ARTICLE_TEXT_LEN} chars for LLM context.")
                 article_text = article_text[:MAX_ARTICLE_TEXT_LEN] + "..."
             full_item = f"{source_info}\n{article_text}\n{end_info}"
             context_items.append(full_item)
             total_context_chars += len(full_item)
        context_str = "\n\n---\n\n".join(context_items)
        
        # Step 4: Define the combined prompt for both responses
        prompt = f"""Generate TWO comprehensive responses to the following question:

RESPONSE 1 - STANDARD: 
- Provide a detailed, comprehensive answer using only your general knowledge
- Include specific examples, dates, and key details where relevant
- Structure your response with clear explanations and context
- Aim for thorough coverage of the topic

RESPONSE 2 - RAG: 
- Analyze the provided 2015 Guardian articles context below
- Cite sources using numbered references [1], [2], [3] corresponding to article numbers
- Synthesize information across articles when relevant  
- Extract specific details, names, dates, and arguments from the articles
- Provide comprehensive coverage using the article context

Context:
---
{context_str}
---

Question: {query}

Format your response as:
STANDARD_RESPONSE:
[comprehensive standard answer here]

RAG_RESPONSE:
[comprehensive context-based answer here with citations]"""

        # Step 5: Call the Generator LLM using the helper function
        combined_response, llm_call_duration = self._call_llm(self.generator_llm, prompt, "Combined Generator")
        
        # Step 6: Parse the combined response into standard and RAG parts
        standard_response = ""
        rag_response = ""
        
        try:
            if "STANDARD_RESPONSE:" in combined_response and "RAG_RESPONSE:" in combined_response:
                parts = combined_response.split("RAG_RESPONSE:")
                standard_part = parts[0].replace("STANDARD_RESPONSE:", "").strip()
                rag_part = parts[1].strip()
                standard_response = standard_part
                rag_response = rag_part
            else:
                # Fallback if parsing fails
                logger.warning("Failed to parse combined response, using fallback")
                standard_response = "Error parsing standard response from combined output."
                rag_response = combined_response
        except Exception as e:
            logger.error(f"Error parsing combined response: {e}")
            standard_response = "Error parsing standard response."
            rag_response = combined_response
        
        return standard_response, rag_response, simplified_context_for_frontend, retrieval_duration, llm_call_duration, total_context_chars

    def evaluate_responses_with_llm(self, query: str, standard_response: str, rag_response: str) -> tuple[dict | None, float]:
        """Uses Evaluator LLM (Gemini Pro 1.5) to evaluate and compare responses."""
        if self.evaluator_llm is None:
            logger.error("Evaluator LLM not available. Skipping LLM evaluation.")
            return None, 0.0

        # Ensuring inputs are valid strings, providing placeholders for errors/None
        standard_response_str = str(standard_response) if standard_response is not None else "(Standard response was None or generation failed)"
        rag_response_str = str(rag_response) if rag_response is not None else "(RAG response was None or generation failed)"
        # Limit length passed to evaluator to avoid overly long prompts if generation failed badly
        max_eval_input_len = 10000 # Ugly hack to limit response length for evaluation prompt
        if len(standard_response_str) > max_eval_input_len:
             standard_response_str = standard_response_str[:max_eval_input_len] + "... (truncated for evaluation)"
        if len(rag_response_str) > max_eval_input_len:
             rag_response_str = rag_response_str[:max_eval_input_len] + "... (truncated for evaluation)"

        logger.info(f"--- Evaluating responses using {EVALUATOR_LLM_MODEL_NAME} for query: '{query[:100]}...' ---")

        # The detailed prompt for the evaluator
        evaluation_prompt = f"""You are an expert evaluator assessing the quality of two AI-generated answers (Standard vs. RAG) to a query about events/topics from the year 2015. The RAG response had access to 2015 news articles.

**Task:** Evaluate both responses on the criteria below (1=Very Poor, 5=Excellent), focusing *only* on the 2015 context. Output **only** a valid JSON object adhering strictly to the specified format. Scores must be integers between 1 and 5.

**Criteria:**
1.  **Relevance (1-5):** How directly does the response address the specific query?
2.  **Factual Accuracy (2015 Context) (1-5):** Accuracy of info *about 2015*? (Ignore other periods).
3.  **Specificity/Detail (2015 Context) (1-5):** Richness in specific 2015 details (names, dates, figures, etc.)?
4.  **Groundedness (RAG Only) (1-5):** Does the RAG response seem based on plausible 2015 sources? Score 1 (generic) to 5 (source-based). Assign "N/A" (as a string) for Standard.
5.  **Temporal Accuracy (1-5):** Does the response correctly stay within/reference the 2015 timeframe?
6.  **Completeness (1-5):** How thoroughly does the response address all aspects of the query?
7.  **Coherence/Readability (1-5):** How well-structured and clear is the response?
8.  **Lack of Hallucination (2015 Context) (1-5):** How free from plausible but false info *about 2015*?

**Query:**
```text
{query}
```

**Standard LLM Response:**
```text
{standard_response_str}
```

**RAG LLM Response:**
```text
{rag_response_str}
```
**Instructions to Evaluator:**  
Return your ratings in the *exact* JSON format below (no extra keys, no comments):

```json
{{
  "standard_scores": {{
    "relevance": <score_int>,
    "factual_accuracy_2015": <score_int>,
    "specificity_2015": <score_int>,
    "temporal_accuracy": <score_int>,
    "completeness": <score_int>,
    "coherence": <score_int>,
    "lack_of_hallucination_2015": <score_int>
  }},
  "rag_scores": {{
    "relevance": <score_int>,
    "factual_accuracy_2015": <score_int>,
    "specificity_2015": <score_int>,
    "groundedness_to_source": <score_int_or_NA_string>,
    "temporal_accuracy": <score_int>,
    "completeness": <score_int>,
    "coherence": <score_int>,
    "lack_of_hallucination_2015": <score_int>
  }},
  "comparative_summary": "<1–2 sentence comparison focusing on 2015 context>"
}}
```"""
        # ---------- code resumes immediately after closing the prompt string ----------
        evaluation_result = None
        llm_eval_duration = 0.0
        start_time = time.time()
        try:
            # Use the helper for the call
            raw_text, llm_eval_duration = self._call_llm(
                self.evaluator_llm,
                evaluation_prompt,
                "LLM Evaluator"
            )

            # Attempt to parse the JSON from the raw_text
            if "Error:" not in raw_text: 
                logger.debug(f"Raw Evaluator LLM Output:\n{raw_text}")
                json_str = None
                try:
                    # Try finding markdown block first
                    json_match = re.search(
                        r'```(?:json)?\s*(\{.*?\})\s*```',
                        raw_text,
                        re.DOTALL | re.IGNORECASE
                    )
                    if json_match:
                        json_str = json_match.group(1)
                        logger.info("Extracted JSON from markdown block.")
                    else:
                        # Fallback hack: find first '{' and last '}'
                        first_brace = raw_text.find('{')
                        last_brace = raw_text.rfind('}')
                        if first_brace != -1 and last_brace != -1:
                            json_str = raw_text[first_brace:last_brace + 1]
                            logger.info("Extracted JSON using first/last brace.")
                        else:
                            raise ValueError(
                                "Could not find JSON structure in evaluator response."
                            )

                    # Validation of basic structure before assigning
                    temp_result = json.loads(json_str)
                    if (
                        "standard_scores" in temp_result and
                        "rag_scores" in temp_result and
                        "comparative_summary" in temp_result
                    ):
                        # Validate/correct groundedness score format
                        grounded_score = temp_result.get(
                            "rag_scores", {}
                        ).get("groundedness_to_source")
                        if not (
                            isinstance(grounded_score, int) and
                            1 <= grounded_score <= 5
                        ) and grounded_score != "N/A":
                            logger.warning(
                                f"Adjusting invalid groundedness score "
                                f"'{grounded_score}' to N/A."
                            )
                            temp_result["rag_scores"]["groundedness_to_source"] = "N/A"

                        evaluation_result = temp_result
                        logger.info("Successfully parsed LLM evaluation result.")
                    else:
                        logger.error(
                            f"Parsed JSON missing required keys: {temp_result.keys()}"
                        )
                        raise ValueError("Parsed JSON has incorrect structure")

                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(
                        f"Could not extract or parse JSON from Evaluator response: {e}",
                        exc_info=True
                    )
                    logger.error(
                        f"Problematic Raw Text (first 500 chars): "
                        f"{raw_text[:500]}..."
                    )
                    evaluation_result = {
                        "error": f"JSON parsing failed: {e}"
                    }  # Store parsing error
            else:
                # Generation itself failed, store the error string
                evaluation_result = {"error": raw_text}

        except Exception as e:
            # Catch errors from _call_llm or other issues
            logger.error(
                f"Unexpected exception during LLM Evaluation processing: {e}",
                exc_info=True
            )
            evaluation_result = {"error": f"Evaluation processing error: {e}"}
            llm_eval_duration = time.time() - start_time  

        logger.info(
            f"LLM Evaluation call and processing duration: "
            f"{llm_eval_duration:.4f} seconds"
        )
        return evaluation_result, llm_eval_duration 
    
_rag_system_instance: "RAGSystem | None" = None

def get_rag_system() -> "RAGSystem":
    """Initialise and return a singleton instance of the RAGSystem."""
    global _rag_system_instance

    if _rag_system_instance is None:
        # To verify that all essential index files exist
        essential_files = {
            "FAISS Index": FAISS_INDEX_PATH,
            "Chunk Metadata": METADATA_PATH,
            "Article Lookup": ARTICLE_LOOKUP_PATH,
        }
        missing_files = [name for name, path in essential_files.items()
                         if not os.path.exists(path)]

        if missing_files:
            logger.error(
                "CRITICAL: Essential files missing: %s",
                ", ".join(missing_files)
            )
            raise FileNotFoundError(
                f"Missing essential data files: {', '.join(missing_files)}. "
                "Run build_index.py before starting the RAG system."
            )
        else:
            logger.info(
                "All essential data files found. Proceeding with RAGSystem initialisation."
            )
            _rag_system_instance = RAGSystem()

    return _rag_system_instance
