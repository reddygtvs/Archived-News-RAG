
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

    # --- Apply gentle filtering ---
    print("Applying gentle content filtering...")
    original_count = len(articles)
    
    # Remove only lightweight/lifestyle sections
    skip_sections = {'fashion', 'food', 'travel', 'lifeandstyle', 'books', 'film', 'stage'}
    articles = [a for a in articles if not any(section in a.get('id', '').lower() for section in skip_sections)]
    
    # Remove very short articles (less than 500 characters)
    articles = [a for a in articles if len(a.get('bodyText', '')) > 500]
    
    # Skip deduplication for now
    print("Skipping deduplication...")
    print(f"Total reduction: {original_count} → {len(articles)} ({100*(original_count-len(articles))/original_count:.1f}% reduction)")

    # --- Save the article lookup dictionary ---
    print(f"Saving article lookup dictionary to {ARTICLE_LOOKUP_PATH}...")
    os.makedirs(os.path.dirname(ARTICLE_LOOKUP_PATH), exist_ok=True)
    try:
        import pickle
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
                # Chunk metadata - text removed to save massive space
                chunk_metadata = {
                    'article_id': article_id,
                    'chunk_index': chunk_index,
                    # 'text' removed - get from article_lookup via article_id when needed
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

    # Skip saving processed chunks debug file to save 800MB+ space
    print(f"Skipping debug file {PROCESSED_DATA_PATH} to save space...")


    print(f"Loading sentence transformer model: {EMBEDDING_MODEL_NAME}...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    print("Generating embeddings for chunks (this will take time)...")
    # Batch size 64 works the best on my 8 GB M2 Macbook air
    embeddings = model.encode(all_chunks_text, show_progress_bar=True, batch_size=64)
    print(f"Generated {embeddings.shape[0]} embeddings of dimension {embeddings.shape[1]}.")

    dimension = embeddings.shape[1]
    
    # Use IndexIVFFlat for massive size reduction (approximate search)
    nlist = min(1024, len(embeddings) // 40)  # Adaptive clusters based on data size
    quantizer = faiss.IndexFlatL2(dimension)
    index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
    
    # Train the index (required for IVF)
    print(f"Training FAISS index with {nlist} clusters...")
    index.train(np.array(embeddings).astype('float32'))
    
    # Convert to float32 and add to trained index
    embeddings_array = np.array(embeddings).astype('float32')
    index.add(embeddings_array)
    
    # ULTRA-AGGRESSIVE: Binary quantization for maximum compression
    print("Creating binary embeddings for maximum compression...")
    # Binary quantization: >0 = 1, <=0 = 0
    embeddings_binary = (embeddings_array > 0).astype(np.uint8)
    binary_path = FAISS_INDEX_PATH.replace('.faiss', '_binary.npy')
    np.save(binary_path, embeddings_binary)
    print(f"Saved binary embeddings to {binary_path} (87% smaller than uint8)")
    
    # Also save uint8 version for fallback
    embeddings_uint8 = (embeddings_array * 127).astype(np.uint8)
    quantized_path = FAISS_INDEX_PATH.replace('.faiss', '_quantized.npy')
    np.save(quantized_path, embeddings_uint8)
    print(f"Saved uint8 fallback to {quantized_path}")

    print(f"Built FAISS index with {index.ntotal} vectors.")

    os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_PATH)
    print(f"Saved FAISS index to {FAISS_INDEX_PATH}")

    # Save chunk metadata using compressed pickle format
    try:
        import pickle
        with open(METADATA_PATH, 'wb') as f:
            pickle.dump(metadata, f, protocol=pickle.HIGHEST_PROTOCOL)
        print(f"Saved compressed chunk metadata to {METADATA_PATH}")
    except Exception as e:
        print(f"Error saving chunk metadata: {e}")

    print("Indexing and lookup file creation complete.")


if __name__ == "__main__":
    process_and_index()