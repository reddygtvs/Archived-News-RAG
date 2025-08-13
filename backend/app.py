# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from rag_core import get_rag_system # to get the instance
from config import API_HOST, API_PORT
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
log = logging.getLogger('werkzeug') # Get Flask's default logger
log.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]}}) # Support multiple ports

# --- Initialize RAG System ---
try:
    rag_system = get_rag_system()
    logging.info("RAG System loaded successfully for Flask app.")
except FileNotFoundError as e:
     logging.error(f"Essential files not found: {e}. Cannot start RAG system.")
     rag_system = None
except Exception as e:
    logging.error(f"An unexpected error occurred during RAG system initialization: {e}", exc_info=True)
    rag_system = None
# --- End Initialization ---


@app.route('/api/query', methods=['POST'])
def handle_query():
    if rag_system is None:
         logging.error("Query received, but RAG system is not initialized.")
         return jsonify({"error": "RAG system failed to initialize. Check backend logs for missing files or other errors."}), 500

    data = request.get_json()
    if not data or 'query' not in data:
        logging.warning("Received request with missing 'query' field.")
        return jsonify({"error": "Missing 'query' in request body"}), 400

    query = data.get('query', '').strip()
    if not query:
         logging.warning("Received empty query.")
         return jsonify({"error": "Query cannot be empty"}), 400

    logging.info(f"Received query from app: '{query[:200]}...'") # Distinguish from evaluate.py logs

    try:
        # Generate both responses in a single LLM call for better performance
        logging.info("App: Generating combined responses...")
        # generate_combined_responses returns (standard_text, rag_text, context_info, retrieval_duration, llm_duration, context_length)
        standard_response_text, rag_response_text, retrieved_context_info, _, _, _ = rag_system.generate_combined_responses(query)

        # Prepare JSON response
        logging.info(f"App: Sending responses to frontend. RAG context items: {len(retrieved_context_info)}")
        return jsonify({
            "standard_response": standard_response_text,
            "rag_response": rag_response_text,
            "retrieved_chunks": retrieved_context_info # key is used by the frontend
        })

    except Exception as e:
        logging.error(f"App: Error processing query '{query[:200]}...': {e}", exc_info=True)
        return jsonify({"error": f"An internal server error occurred while processing your request."}), 500

# Simple health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
     status = "OK" if rag_system is not None else "Error: RAG System Not Initialized"
     code = 200 if rag_system is not None else 503
     logging.debug(f"Health check returning: {status} ({code})")
     return jsonify({"status": status}), code


if __name__ == '__main__':
     if rag_system is None:
          logging.critical("Cannot start Flask server because RAG system initialization failed.")
     else:
          logging.info(f"Starting Flask server on http://{API_HOST}:{API_PORT}")
          app.run(host=API_HOST, port=API_PORT, debug=False) 