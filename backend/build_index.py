
import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pickle
from config import (RAW_DATA_PATH, PROCESSED_DATA_PATH, EMBEDDING_MODEL_NAME,
                    CHUNK_SIZE, CHUNK_OVERLAP, FAISS_INDEX_PATH, METADATA_PATH)

# --- Path for the combined lookup file ---
ARTICLE_LOOKUP_PATH = "data/article_lookup.pkl"

def process_and_index():
    """Loads raw data, processes text, generates embeddings, builds FAISS index,
       and creates an article lookup file (text, title, url, date).""" 
    print(f"Loading raw articles from {RAW_DATA_PATH}...")
    articles = []
    # --- Dictionary stores article details (text, title, url, date) ---
    article_lookup = {}
    # ---
    try:
        with open(RAW_DATA_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    article_data = json.loads(line)
                    articles.append(article_data)
                    # --- Store full details including date ---
                    article_id = article_data.get('id')
                    if article_id and 'bodyText' in article_data:
                        article_lookup[article_id] = {
                            'text': article_data['bodyText'],
                            'title': article_data.get('webTitle'),
                            'url': article_data.get('webUrl'),
                            'date': article_data.get('webPublicationDate')
                        }
                    # ---
                except json.JSONDecodeError as e:
                    print(f"Skipping line due to JSON decode error: {e} - Line: {line[:100]}...")

    except FileNotFoundError:
        print(f"Error: Raw data file not found at {RAW_DATA_PATH}. Run data_fetcher.py first.")
        return

    if not articles:
        print("No articles found in the raw data file.")
        return

    print(f"Loaded {len(articles)} articles and stored details for {len(article_lookup)} unique IDs.")

    # --- Save the article lookup dictionary ---
    print(f"Saving article lookup dictionary to {ARTICLE_LOOKUP_PATH}...")
    os.makedirs(os.path.dirname(ARTICLE_LOOKUP_PATH), exist_ok=True)
    try:
        with open(ARTICLE_LOOKUP_PATH, 'wb') as f_pkl:
            pickle.dump(article_lookup, f_pkl)
        print("Article lookup saved successfully.")
    except Exception as e:
        print(f"Error saving article lookup: {e}")
    # ---

    # --- Chunking and Metadata Generation ---
    print(f"Processing and chunking text (Chunk Size: {CHUNK_SIZE}, Overlap: {CHUNK_OVERLAP})...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP, 
        length_function=len,
        add_start_index=True,
    )

    all_chunks_text = []
    metadata = {}
    chunk_counter = 0

    for i, article in enumerate(articles):
        article_id = article.get('id')
        # Here I'm using lookup for consistency and access to potentially cleaned/stored text
        if not article_id or article_id not in article_lookup:
            continue

        article_details = article_lookup[article_id]
        body_text = article_details.get('text')

        if not body_text: continue

        try:
            chunks = text_splitter.split_text(body_text)
            for chunk_index, chunk_text in enumerate(chunks):
                # Chunk metadata primarily needs article_id to link back
                chunk_metadata = {
                    'article_id': article_id,
                    'chunk_index': chunk_index,
                    'text': chunk_text # Keeping for potential debug/inspection
                }
                metadata[chunk_counter] = chunk_metadata
                all_chunks_text.append(chunk_text)
                chunk_counter += 1
        except Exception as e:
             print(f"Error chunking article {article_id}: {e}")

        if (i + 1) % 10000 == 0:
             print(f"Processed {i+1}/{len(articles)} articles for chunking...")

    # --- Rest of the script (saving processed chunks, embedding, indexing) ---
    if not all_chunks_text:
        print("No text chunks were generated for embedding.")
        return

    print(f"Generated {len(all_chunks_text)} text chunks for embedding.")

    # Save processed chunks metadata
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    try:
        with open(PROCESSED_DATA_PATH, 'w', encoding='utf-8') as f:
            for chunk_id, chunk_meta in metadata.items():
                f.write(json.dumps({**chunk_meta, "global_chunk_id": chunk_id}) + '\n')
        print(f"Saved processed chunks metadata to {PROCESSED_DATA_PATH}")
    except Exception as e:
        print(f"Error saving processed chunks metadata: {e}")


    print(f"Loading sentence transformer model: {EMBEDDING_MODEL_NAME}...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    print("Generating embeddings for chunks (this will take time)...")
    # Batch size 64 works the best on my 8 GB M2 Macbook air
    embeddings = model.encode(all_chunks_text, show_progress_bar=True, batch_size=64)
    print(f"Generated {embeddings.shape[0]} embeddings of dimension {embeddings.shape[1]}.")

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings).astype('float32'))

    print(f"Built FAISS index with {index.ntotal} vectors.")

    os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_PATH)
    print(f"Saved FAISS index to {FAISS_INDEX_PATH}")

    # Save chunk metadata by mapping FAISS index ID to chunk info including article_id
    try:
        with open(METADATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=None)
        print(f"Saved chunk metadata mapping to {METADATA_PATH}")
    except Exception as e:
        print(f"Error saving chunk metadata: {e}")

    print("Indexing and lookup file creation complete.")


if __name__ == "__main__":
    process_and_index()