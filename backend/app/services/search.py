import os
import threading
from typing import List
import numpy as np
from app.core.config import settings

dimension = 384
index_file = settings.FAISS_INDEX_PATH
storage_path = index_file + ".npz"

# Ensure storage directory exists
_index_dir = os.path.dirname(index_file)
if _index_dir:
    os.makedirs(_index_dir, exist_ok=True)

# Lazy-loaded embedding model with thread-safety lock
_embedding_model = None
_model_lock = threading.Lock()

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        with _model_lock:
            if _embedding_model is None:
                try:
                    from sentence_transformers import SentenceTransformer
                    _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
                    print(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
                except Exception as e:
                    print(f"Warning: Could not load sentence-transformers model: {e}. Semantic search disabled.")
    return _embedding_model

# In-memory vector store mapping event_id -> embedding
vector_store = {}

# Load existing vectors from disk if present
if os.path.exists(storage_path):
    try:
        data = np.load(storage_path)
        for key in data.files:
            vector_store[int(key)] = data[key]
    except Exception as e:
        print(f"Error loading numpy index: {e}")

def _persist_vector_store():
    try:
        np.savez(storage_path, **{str(k): v for k, v in vector_store.items()})
    except Exception as e:
        print(f"Error persisting vector store: {e}")

def get_embedding(text: str) -> np.ndarray:
    """Generate embedding using the lazy-loaded model, or return zero vector on failure."""
    model = get_embedding_model()
    if model is not None:
        try:
            return model.encode(text)
        except Exception as e:
            print(f"Embedding generation error: {e}")
    return np.zeros((dimension,), dtype=np.float32)

def index_event(event_id: int, title: str, description: str):
    """Index or update an event's embedding in the vector store and persist."""
    text = f"{title}. {description}"
    vector = get_embedding(text)
    vector_store[event_id] = vector
    _persist_vector_store()

def remove_event_embedding(event_id: int):
    """Remove an event's embedding from the index and persist changes to disk."""
    if event_id in vector_store:
        del vector_store[event_id]
        _persist_vector_store()

def search_events(query: str, top_k: int = 10) -> List[int]:
    """Perform cosine similarity search against stored embeddings."""
    if not vector_store:
        return []
        
    query_vector = get_embedding(query)
    query_norm = np.linalg.norm(query_vector)
    if query_norm == 0:
        return []
    
    query_vector = query_vector / query_norm
    ids = list(vector_store.keys())
    vectors = np.stack([vector_store[i] for i in ids])
    
    v_norms = np.linalg.norm(vectors, axis=1)
    valid = v_norms > 0
    if not np.any(valid):
        return []
    
    vectors[valid] = vectors[valid] / v_norms[valid, np.newaxis]
    similarities = np.dot(vectors, query_vector)
    
    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [int(ids[i]) for i in top_indices]
