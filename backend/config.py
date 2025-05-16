# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# --- Data ---
GUARDIAN_API_URL = "https://content.guardianapis.com/search"
GUARDIAN_API_KEY = os.getenv("GUARDIAN_API_KEY")
START_DATE = "2015-12-03"
END_DATE = "2015-12-31"
PAGE_SIZE = int(os.getenv("GUARDIAN_PAGE_SIZE", 50))
TOTAL_ARTICLES_TARGET = int(os.getenv("GUARDIAN_TOTAL_ARTICLES_TO_FETCH", 200))
RAW_DATA_PATH = "data/guardian_articles.jsonl" # JSON Lines format
PROCESSED_DATA_PATH = "data/processed_chunks.jsonl"

# --- Embedding & Indexing ---
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
FAISS_INDEX_PATH = "data/news_index.faiss"
METADATA_PATH = "data/metadata.json" # Mapping FAISS index to chunk info

# --- RAG ---
RETRIEVAL_K = 5 # Number of chunks to retrieve

# --- LLM ---
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL_NAME = "gemini-1.5-flash" # Using flash as the base model

# --- API ---
API_HOST = "127.0.0.1"
API_PORT = 5001 # Port for the backend API server