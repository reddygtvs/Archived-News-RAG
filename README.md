# Enhancing LLM Performance with Archived News: A Focused RAG Approach

This project implements and evaluates a Retrieval-Augmented Generation (RAG) system designed to enhance Large Language Model (LLM) performance for queries about historical events, specifically focusing on news articles from The Guardian covering the year 2015. The system leverages a focused archival news corpus to provide specific temporal context to an LLM, aiming to improve factual accuracy, specificity, and reduce hallucinations.

The evaluation framework includes automated metric collection and an LLM-based assessment (using Google's Gemini 1.5 Pro) to compare the RAG system (using Gemini 1.5 Flash as the generator) against a baseline LLM (also Gemini 1.5 Flash).

## Features

- **Automated Data Ingestion:** Fetches news articles from The Guardian API for a specified period (2015).
- **Full-Text Processing & Chunking:** Preprocesses full article text and segments it into manageable, overlapping chunks.
- **Semantic Embedding & Indexing:** Uses Sentence-BERT (SBERT) for embedding text chunks and FAISS for efficient similarity search.
- **RAG Pipeline:** Retrieves relevant full articles based on chunk similarity and provides them as context to a generator LLM (Gemini 1.5 Flash).
- **LLM-as-Evaluator:** Employs Gemini 1.5 Pro for a comprehensive qualitative assessment of generated responses.
- **Automated Evaluation & Plotting:** Scripts to run a suite of test queries, collect detailed metrics, and generate various performance visualizations.
- **Web Interface:** A simple React frontend to interactively test the RAG system vs. the baseline LLM.

## Project Structure

```text
archived-news-rag/
├── backend/
│   ├── data/                       # Stores fetched data, indexes, results, plots
│   │   └── (generated files)…      # guardian_articles.jsonl, article_lookup.pkl,
│   │                               # news_index.faiss, metadata.json,
│   │                               # evaluation_results_v2.jsonl,
│   │                               # plots_final_automated/  (all git-ignored)
│   ├── .env.example                # Example environment file (DO NOT COMMIT .env)
│   ├── config.py                   # Configuration settings
│   ├── requirements.txt            # Python dependencies
│   ├── data_fetcher.py             # Fetches data from the Guardian API
│   ├── build_index.py              # Builds FAISS index / look-ups
│   ├── rag_core.py                 # Core RAG logic, LLM calls, evaluation
│   ├── evaluate.py                 # Runs automated evaluation
│   ├── plot_results.py             # Generates plots from evaluation results
│   ├── app.py                      # Flask API server for the web interface
│   ├── test_queries.json           # Pre-defined queries for evaluation  <-- CORRECTED LOCATION
│   └── wsgi.py                     # WSGI entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx                 # Main React component
│   │   └── main.tsx                # React entry point
│   ├── package.json                # Node dependencies
│   └── vite.config.ts              # Vite configuration
└── README.md                       # This file
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Access to The Guardian Open Platform API (get a free developer key)
- Access to Google AI Gemini API (get an API key from Google AI Studio)

### Backend Setup

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a Python virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up Environment Variables:**
    - Copy `.env.example` to a new file named `.env` in the `backend` directory:
      ```bash
      cp .env.example .env
      ```
    - Open `.env` and replace the placeholder values with your actual API keys:
      ```
      GUARDIAN_API_KEY="YOUR_GUARDIAN_API_KEY"
      GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
      ```
    - You can also adjust data fetching parameters in `.env` if needed (e.g., `GUARDIAN_TOTAL_ARTICLES_TO_FETCH` for initial testing, though `data_fetcher.py` is currently hardcoded for the 2015 range).

### Frontend Setup

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

## Running the Application & Generating Data

**Important Note on Python Execution:** If you encounter `ModuleNotFoundError` when running Python scripts, ensure your virtual environment is activated. If issues persist, try running scripts by explicitly calling the Python interpreter from the `venv` directory, e.g., `./venv/bin/python your_script_name.py` (on macOS/Linux) or `venv\Scripts\python your_script_name.py` (on Windows).

### 1. Data Fetching (One-time or when updating data source)

This script fetches articles from The Guardian API for the year 2015.

- Ensure your API keys are correctly set in `backend/.env`.
- Run from the `backend` directory:

  ```bash
  # If venv is active:
  python data_fetcher.py
  # Or explicitly:
  # ./venv/bin/python data_fetcher.py
  ```

- This will create `backend/data/guardian_articles.jsonl`. This step can take a significant amount of time depending on the number of articles (for full 2015, approx. 118k articles, allow several hours and monitor for API limits/errors).

### 2. Building the Index & Lookup Files (One-time after fetching or if data changes)

This script processes the fetched articles, creates text chunks, generates embeddings, builds the FAISS index, and saves necessary lookup files.

- Ensure `guardian_articles.jsonl` exists from the previous step.
- Run from the `backend` directory:
  ```bash
  # If venv is active:
  python build_index.py
  # Or explicitly:
  # ./venv/bin/python build_index.py
  ```
- This is a very computationally intensive step, especially embedding ~1.3 million chunks. It can take **many hours (24-36+ hours on an M2 Macbook Air)** on a CPU. Ensure your machine does not go to sleep. Monitor for memory issues; if OOM errors occur, you might need to reduce `batch_size` in `build_index.py` within the `model.encode(...)` call.
- This will create:
  - `backend/data/article_lookup.pkl` (Full texts, titles, URLs)
  - `backend/data/processed_chunks.jsonl` (For inspection)
  - `backend/data/news_index.faiss` (Vector index)
  - `backend/data/metadata.json` (Chunk metadata)

### 3. Running the Interactive Web Application (Optional for testing)

Once the index is built, you can run the web app to interact with the RAG system.

1.  **Start the Backend API Server:**

    - From the `backend` directory (with venv active):
      ```bash
      python app.py
      # Or explicitly:
      # ./venv/bin/python app.py
      ```
    - The server will start on `http://127.0.0.1:5001`.

2.  **Start the Frontend Development Server:**
    - Open a **new terminal**.
    - Navigate to the `frontend` directory:
      ```bash
      cd frontend
      ```
    - Run the Vite development server:
      ```bash
      npm run dev
      ```
    - Open your browser to the address provided (usually `http://localhost:5173`).

### 4. Running Automated Evaluation & Plotting Results

This is key for reproducing the paper's results.

1.  **Run the Evaluation Script:**

    - Ensure steps 1 (Data Fetching) and 2 (Building Index) are complete.
    - Ensure API keys are in `backend/.env`.
    - From the `backend` directory (with venv active):
      ```bash
      python evaluate.py
      # Or explicitly:
      # ./venv/bin/python evaluate.py
      ```
    - This script will run all 20 test queries against both Standard and RAG methods, and then use Gemini 1.5 Pro for LLM-based evaluation. This will take a **significant amount of time** due to multiple LLM calls per query.
    - It will create `backend/data/evaluation_results_v2.jsonl`.

2.  **Generate Plots and Tables:**
    - After `evaluate.py` completes successfully:
    - From the `backend` directory (with venv active):
      ```bash
      python plot_results.py
      # Or explicitly:
      # ./venv/bin/python plot_results.py
      ```
    - This will read `evaluation_results_v2.jsonl` and generate ~15 PNG plots and 2 text tables in the `backend/data/plots_final_automated/` directory.

## Key Generated Data Files (Located in `backend/data/`)

- `guardian_articles.jsonl`: Raw articles fetched from The Guardian API (JSON Lines format).
- `article_lookup.pkl`: Python Pickle file containing a dictionary mapping article IDs to their full text, title, and URL. Used for fast full-text retrieval.
- `processed_chunks.jsonl`: Cleaned text chunks with metadata, primarily for inspection/debugging of the chunking process.
- `news_index.faiss`: The FAISS vector index containing embeddings of all text chunks.
- `metadata.json`: Maps FAISS index IDs back to chunk metadata (e.g., source article ID, original chunk text).
- `test_queries.json`: The predefined set of 20 queries used for automated evaluation.
- `evaluation_results_v2.jsonl`: The detailed results from the automated evaluation run, including all collected metrics and LLM-based evaluation scores for each query.
- `plots_final_automated/`: Directory containing all generated plots (PNGs) and summary tables (TXTs) from `plot_results.py`.

## Configuration

- **API Keys & Fetch Parameters:** Managed in `backend/.env`.
- **Core System Parameters:** Model names, file paths, chunking settings, retrieval K are in `backend/config.py`.
- **RAG Logic & LLM Evaluation Prompt:** Contained within `backend/rag_core.py`.
- **Test Queries:** Defined in `backend/test_queries.json`.

## Troubleshooting

- **`ModuleNotFoundError`:** Ensure your Python virtual environment (`venv`) is activated before running backend scripts. If using an IDE, make sure it's configured to use the `venv` interpreter.
- **API Key Errors:** Double-check that your `.env` file in the `backend` directory contains the correct and active API keys for The Guardian and Google AI (Gemini).
- **FAISS/Data File Not Found:** Ensure `data_fetcher.py` and then `build_index.py` have been run successfully in that order before attempting to run `app.py` (for the web UI) or `evaluate.py`.
- **Long Runtimes:** Data fetching, indexing (especially embedding), and the full evaluation script are computationally intensive and will take a long time. This is expected.
- **Memory Errors (OOM) during `build_index.py`:** If you run out of memory during the embedding phase, reduce the `batch_size` parameter in the `model.encode(...)` call within `build_index.py` (e.g., from 128 to 64 or 32) and restart the script (you may want to delete incomplete index/metadata files first).
