from __future__ import annotations

import hashlib
import json
import logging
import math
import re
from pathlib import Path
from typing import Dict, List

logger = logging.getLogger(__name__)


class PolicyRAGService:
    def __init__(self, docs_path: Path, persist_dir: Path, embedding_dim: int = 192):
        self.docs_path = docs_path
        self.persist_dir = persist_dir
        self.embedding_dim = embedding_dim

        self.documents = self._load_documents()
        self.vectors = {doc["id"]: self._embed_text(doc["content"]) for doc in self.documents}

        self.backend = "in_memory"
        self.collection = None
        self._init_chroma()

    def _load_documents(self) -> List[Dict[str, str]]:
        if not self.docs_path.exists():
            return []
        try:
            data = json.loads(self.docs_path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return [d for d in data if isinstance(d, dict) and "id" in d and "content" in d]
        except json.JSONDecodeError:
            logger.warning("Policy docs JSON parsing failed: %s", self.docs_path)
        return []

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"[a-zA-Z0-9\u0900-\u097F\u0C00-\u0C7F]+", text.lower())

    def _embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.embedding_dim
        tokens = self._tokenize(text)
        if not tokens:
            return vec

        for token in tokens:
            digest = hashlib.md5(token.encode("utf-8")).hexdigest()
            idx = int(digest, 16) % self.embedding_dim
            vec[idx] += 1.0

        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    @staticmethod
    def _cosine(a: List[float], b: List[float]) -> float:
        return float(sum(x * y for x, y in zip(a, b)))

    def _init_chroma(self) -> None:
        try:
            import chromadb

            self.persist_dir.mkdir(parents=True, exist_ok=True)
            client = chromadb.PersistentClient(path=str(self.persist_dir))
            self.collection = client.get_or_create_collection(name="policy_chunks")

            if self.documents:
                ids = [doc["id"] for doc in self.documents]
                docs = [doc["content"] for doc in self.documents]
                embeddings = [self.vectors[doc_id] for doc_id in ids]
                metadatas = [
                    {
                        "scheme_id": doc.get("scheme_id", ""),
                        "title": doc.get("title", ""),
                        "source": doc.get("source", ""),
                    }
                    for doc in self.documents
                ]
                self.collection.upsert(ids=ids, documents=docs, embeddings=embeddings, metadatas=metadatas)

            self.backend = "chromadb"
        except Exception as exc:
            logger.warning("ChromaDB init failed, using in-memory retrieval: %s", exc)
            self.backend = "in_memory"
            self.collection = None

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, str | float]]:
        if not self.documents:
            return []

        query_embedding = self._embed_text(query_text)

        if self.collection is not None:
            try:
                result = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    include=["documents", "metadatas", "distances"],
                )
                docs = result.get("documents", [[]])[0]
                metadatas = result.get("metadatas", [[]])[0]
                distances = result.get("distances", [[]])[0]

                output: List[Dict[str, str | float]] = []
                for doc, meta, distance in zip(docs, metadatas, distances):
                    output.append(
                        {
                            "scheme_id": str((meta or {}).get("scheme_id", "")),
                            "title": str((meta or {}).get("title", "")),
                            "source": str((meta or {}).get("source", "")),
                            "snippet": str(doc)[:240],
                            "score": round(float(1.0 - float(distance)), 4),
                        }
                    )
                return output
            except Exception as exc:
                logger.warning("ChromaDB query failed, fallback to in-memory retrieval: %s", exc)

        scored: List[tuple[float, Dict[str, str]]] = []
        for doc in self.documents:
            score = self._cosine(query_embedding, self.vectors[doc["id"]])
            scored.append((score, doc))

        scored.sort(key=lambda item: item[0], reverse=True)
        output: List[Dict[str, str | float]] = []
        for score, doc in scored[:top_k]:
            output.append(
                {
                    "scheme_id": str(doc.get("scheme_id", "")),
                    "title": str(doc.get("title", "")),
                    "source": str(doc.get("source", "")),
                    "snippet": str(doc.get("content", ""))[:240],
                    "score": round(float(score), 4),
                }
            )
        return output
