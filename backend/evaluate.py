import json
import time
import os
import re
from datetime import datetime
import pandas as pd
from rag_core import get_rag_system 
import logging
import numpy as np # Needed for json dump default

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('evaluate')

# --- Configuration ---
TEST_QUERIES_FILE = "test_queries.json"
RESULTS_FILE = "data/evaluation_results_v2.jsonl" 
SLEEP_BETWEEN_QUERIES = 5 # Keep sleep time to prevent API fetch limit for the expensive pro LLM

# --- Helper Functions ---
def count_citations(text: str) -> int:
    """Counts Guardian URL citations in the format (URL: https://www.theguardian.com/...)"""
    if not isinstance(text, str): return 0
    pattern = r"\(\s*URL:\s*https?://(?:www\.)?theguardian\.com/[^)]+\)"
    # returns a list of all non-overlapping matches
    return len(re.findall(pattern, text, re.IGNORECASE))

def calculate_word_count(text: str) -> int:
    """Simple word count based on whitespace splitting."""
    if not isinstance(text, str): return 0
    return len(text.split())

# --- Main Evaluation Logic ---
def run_evaluation():
    logger.info("--- Starting Automated Evaluation Script v2 ---")

    # Load Test Queries
    try:
        with open(TEST_QUERIES_FILE, 'r', encoding='utf-8') as f:
            test_queries = json.load(f)
        logger.info(f"Loaded {len(test_queries)} test queries from {TEST_QUERIES_FILE}")
    except Exception as e:
        logger.error(f"Error loading test queries from {TEST_QUERIES_FILE}: {e}", exc_info=True)
        return

    # Initialize RAG System
    try:
        logger.info("Initializing RAG System...")
        rag_system = get_rag_system()
        logger.info("RAG System initialized.")
        if rag_system.evaluator_llm is None:
             logger.warning("Evaluator LLM (Gemini Pro) could not be initialized. LLM-based evaluation will be skipped.")
    except Exception as e:
        logger.error(f"Critical error initializing RAG system: {e}. Cannot proceed.", exc_info=True)
        return

    # --- Data Collection Loop ---
    results = []
    start_run_time = time.time()

    for i, item in enumerate(test_queries):
        query_id = item.get("id", f"query_{i+1}")
        query_text = item.get("query")

        if not query_text:
            logger.warning(f"Skipping query item {i+1} due to missing 'query' field.")
            continue

        logger.info(f"\n--- Processing Query {i+1}/{len(test_queries)}: [{query_id}] ---")
        logger.info(f"Query: {query_text[:100]}...")

        # Initialize dictionary to store all results for this query
        query_data = {
            "query_id": query_id, "query_text": query_text, "timestamp": datetime.now().isoformat(),
            "standard_response": None, "standard_response_wc": 0, "standard_llm_duration": 0.0,
            "rag_response": None, "rag_response_wc": 0, "rag_citation_count": 0,
            "rag_retrieved_articles_count": 0, "rag_retrieved_context_summary": [], "rag_min_distances": [],
            "rag_retrieval_duration": 0.0, "rag_llm_duration": 0.0, "rag_context_length_chars": 0,
            "rag_total_duration": 0.0, "llm_evaluation": None, "llm_evaluation_duration": 0.0,
            "query_eval_duration_total": 0.0
        }
        eval_start_time = time.time()
        std_response_text_for_eval = "Error: Generation failed" # Default text if generation fails
        rag_response_text_for_eval = "Error: Generation failed"

        # 1. Standard LLM Call
        logger.info("Running Standard LLM...")
        if rag_system.generator_llm: # Check if generator is available
             try:
                 std_response, std_llm_duration = rag_system.generate_standard_response(query_text)
                 query_data["standard_response"] = std_response
                 query_data["standard_response_wc"] = calculate_word_count(std_response)
                 query_data["standard_llm_duration"] = std_llm_duration
                 std_response_text_for_eval = std_response # Store for evaluator
             except Exception as e:
                 logger.error(f"Error during Standard LLM call for {query_id}: {e}", exc_info=True)
                 query_data["standard_response"] = f"ERROR: {e}"
                 std_response_text_for_eval = f"ERROR: {e}" # Pass error text to evaluator
        else:
             logger.error("Standard LLM (Generator) unavailable, skipping call.")
             query_data["standard_response"] = "ERROR: Generator LLM not available"
             std_response_text_for_eval = "ERROR: Generator LLM not available"
        logger.info(f"Standard LLM finished (LLM time: {query_data['standard_llm_duration']:.2f}s).")

        # 2. RAG LLM Call
        logger.info("Running RAG LLM...")
        if rag_system.generator_llm: 
            try:
                rag_response, retrieved_context_info, rag_retrieval_duration, rag_llm_duration, rag_context_length = rag_system.generate_rag_response(query_text)
                query_data["rag_response"] = rag_response
                query_data["rag_response_wc"] = calculate_word_count(rag_response)
                query_data["rag_citation_count"] = count_citations(rag_response)
                query_data["rag_retrieved_articles_count"] = len(retrieved_context_info)
                query_data["rag_retrieved_context_summary"] = [
                     {"id": ctx.get("article_id"), "title": ctx.get("title"), "dist": ctx.get("min_distance")}
                     for ctx in retrieved_context_info ]
                query_data["rag_min_distances"] = [
                    ctx.get("min_distance") for ctx in retrieved_context_info if ctx.get("min_distance") is not None ]
                query_data["rag_retrieval_duration"] = rag_retrieval_duration
                query_data["rag_llm_duration"] = rag_llm_duration
                query_data["rag_context_length_chars"] = rag_context_length
                query_data["rag_total_duration"] = rag_retrieval_duration + rag_llm_duration
                rag_response_text_for_eval = rag_response # Store for evaluator
            except Exception as e:
                logger.error(f"Error during RAG LLM call for {query_id}: {e}", exc_info=True)
                query_data["rag_response"] = f"ERROR: {e}"
                rag_response_text_for_eval = f"ERROR: {e}" # To pass error text
        else:
            logger.error("RAG LLM (Generator) unavailable, skipping call.")
            query_data["rag_response"] = "ERROR: Generator LLM not available"
            rag_response_text_for_eval = "ERROR: Generator LLM not available"
        logger.info(f"RAG LLM finished (Retrieval: {query_data['rag_retrieval_duration']:.2f}s, LLM: {query_data['rag_llm_duration']:.2f}s, Total: {query_data['rag_total_duration']:.2f}s).")

        # 3. LLM-as-Evaluator Call 
        if rag_system.evaluator_llm:
            logger.info("Running LLM-based Evaluation...")
            try:
                # Ensure we pass valid strings, even if they are error messages
                llm_eval_result, llm_eval_duration = rag_system.evaluate_responses_with_llm(
                    query_text,
                    str(std_response_text_for_eval), # Hack to force string conversion
                    str(rag_response_text_for_eval)
                )
                query_data["llm_evaluation"] = llm_eval_result # Store the dict or None
                query_data["llm_evaluation_duration"] = llm_eval_duration
            except Exception as e:
                logger.error(f"Error during LLM Evaluation call for {query_id}: {e}", exc_info=True)
                query_data["llm_evaluation"] = {"error": str(e)} # Store error info
                query_data["llm_evaluation_duration"] = 0.0
            logger.info(f"LLM Evaluation finished in {query_data['llm_evaluation_duration']:.2f}s.")
        else:
            logger.warning("Skipping LLM-based evaluation as evaluator model is not available.")


        eval_end_time = time.time()
        query_data["query_eval_duration_total"] = eval_end_time - eval_start_time
        logger.info(f"Total processing time for query {query_id}: {query_data['query_eval_duration_total']:.2f}s")

        results.append(query_data)

        # Optional sleep
        if SLEEP_BETWEEN_QUERIES > 0 and i < len(test_queries) - 1:
            logger.info(f"Sleeping for {SLEEP_BETWEEN_QUERIES}s...")
            time.sleep(SLEEP_BETWEEN_QUERIES)

    # --- Save Results ---
    end_run_time = time.time()
    logger.info(f"\n--- Evaluation Complete ---")
    logger.info(f"Total run time: {end_run_time - start_run_time:.2f} seconds for {len(results)} queries.")

    try:
        os.makedirs(os.path.dirname(RESULTS_FILE), exist_ok=True)
        with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
            for result in results:
                # Use default handler for numpy types during saving
                f.write(json.dumps(result, default=lambda x: float(x) if isinstance(x, np.floating) else (int(x) if isinstance(x, np.integer) else None)) + '\n')
        logger.info(f"Results saved successfully to {RESULTS_FILE}")
    except Exception as e:
        logger.error(f"Error writing results to {RESULTS_FILE}: {e}", exc_info=True)

    try:
        df = pd.read_json(RESULTS_FILE, lines=True)
        logger.info("\n--- Results Summary (First 5 Rows) ---")
        summary_cols = [
            'query_id', 'standard_llm_duration', 'rag_retrieval_duration', 'rag_llm_duration',
            'rag_total_duration', 'llm_evaluation_duration', 'rag_citation_count',
            'rag_retrieved_articles_count', 'standard_response_wc', 'rag_response_wc'
        ]
        display_cols = [col for col in summary_cols if col in df.columns]
        # Use print directly for pandas output
        print(df[display_cols].head().to_string())
    except Exception as e:
        logger.error(f"Could not load results into pandas for summary: {e}", exc_info=True)

if __name__ == "__main__":
    run_evaluation()