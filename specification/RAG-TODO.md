# RAG System — Full Implementation Todo List

> Frontend: React + Vite + TypeScript + Tailwind + Zustand + React Query
> Backend: FastAPI + LangChain + Python
> Observability: Arize Phoenix
> Deployment: Vercel (frontend) + Docker (backend)

Legend: `[ ]` todo · `[~]` partial · `[x]` done

---

## Covered (already specced — implement as written in staged prompt)

- [x] Chat UI — streaming, conversation list, message bubbles
- [x] Source panel — cited [1][2] inline, expandable SourceCard
- [x] Auth — login page, JWT, ProtectedRoute, authStore
- [x] RBAC — permission matrix, RoleGuard, sidebar filtering
- [x] Knowledge Base page — document table, search, filter, delete
- [x] File upload UI — drag-and-drop, progress bar, status badges
- [x] Settings page — model, top-K, temperature, token limits
- [x] Phoenix trace integration — latency badge, TraceLink, SpanWaterfall
- [x] CI/CD — GitHub Actions + Vercel deployment

---

## Area 1 — Retrieval Pipeline

### 1.1 Hybrid Search (Dense + Sparse / BM25)

**What:** Combine vector similarity search with BM25 keyword search, merge results using
Reciprocal Rank Fusion (RRF) before reranking. Catches exact keyword matches (product codes,
names, acronyms) that dense embeddings miss.

#### Backend (FastAPI + LangChain)

- [ ] Install dependencies
  ```
  pip install rank-bm25 langchain-community langchain-openai
  ```

- [ ] Create `app/retrieval/hybrid_retriever.py`
  ```python
  from langchain.retrievers import EnsembleRetriever
  from langchain_community.retrievers import BM25Retriever
  from langchain_community.vectorstores import Chroma  # or Pinecone/Weaviate

  class HybridRetriever:
      def __init__(self, vectorstore, documents, weights=(0.5, 0.5)):
          bm25 = BM25Retriever.from_documents(documents)
          bm25.k = 10
          dense = vectorstore.as_retriever(search_kwargs={"k": 10})
          self.retriever = EnsembleRetriever(
              retrievers=[bm25, dense],
              weights=list(weights)
          )

      def invoke(self, query: str):
          return self.retriever.invoke(query)
  ```

- [ ] Add `hybrid_weight` field to `RAGSettings` model in `app/models/settings.py`
  ```python
  class RAGSettings(BaseModel):
      hybrid_weight_dense: float = 0.5   # 0.0 = BM25 only, 1.0 = dense only
      hybrid_weight_sparse: float = 0.5
  ```

- [ ] Wire `HybridRetriever` into the main RAG chain in `app/chains/rag_chain.py`
  - Replace `vectorstore.as_retriever()` with `HybridRetriever(vectorstore, docs, weights)`
  - Load weights from `RAGSettings` at chain build time

- [ ] Expose settings via `GET/POST /api/settings` — include `hybrid_weight_dense`

- [ ] Add integration test: query with a product code that only BM25 would find

#### Frontend (React)

- [ ] Add "Hybrid search weight" slider to `SettingsForm`
  - Label: "Retrieval balance"
  - Left label: "Keyword (BM25)", Right label: "Semantic"
  - Range: 0.0 → 1.0, step 0.1
  - Maps to `hybrid_weight_dense` in `RAGSettings` type

---

### 1.2 Cross-Encoder Reranking

**What:** After initial retrieval (top-20), pass query + each chunk through a cross-encoder
model that scores relevance jointly. Return top-K of the reranked results. Dramatically
improves precision at the cost of ~100–300ms latency.

#### Backend

- [ ] Install dependencies
  ```
  pip install sentence-transformers
  # or: pip install cohere  (for Cohere Rerank API)
  ```

- [ ] Create `app/retrieval/reranker.py`
  ```python
  from sentence_transformers import CrossEncoder
  from langchain_core.documents import Document

  class CrossEncoderReranker:
      def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
          self.model = CrossEncoder(model_name)

      def rerank(self, query: str, documents: list[Document], top_k: int = 5) -> list[Document]:
          pairs = [(query, doc.page_content) for doc in documents]
          scores = self.model.predict(pairs)
          ranked = sorted(zip(scores, documents), reverse=True)
          for score, doc in ranked:
              doc.metadata["rerank_score"] = float(score)
          return [doc for _, doc in ranked[:top_k]]
  ```

- [ ] Add `reranker_enabled: bool` and `reranker_model: str` to `RAGSettings`

- [ ] Update `app/chains/rag_chain.py` to call `reranker.rerank()` after retrieval step

- [ ] Log rerank scores into OpenTelemetry span attributes for Phoenix

- [ ] Add `rerank_score` to each `Source` in the API response alongside existing `score`

#### Frontend

- [ ] Add "Enable reranking" toggle to `SettingsForm`
- [ ] Update `RelevanceScoreBadge` to show `rerank_score` when available (preferred over raw score)
- [ ] Update `SourceCard` to label the score field: "Rerank score" vs "Similarity score"

---

### 1.3 Query Expansion + HyDE

**What:** Before retrieval, generate 3 alternative rephrasings of the user query and union
the results (Multi-Query). Optionally use HyDE (Hypothetical Document Embedding): generate
a hypothetical answer, embed it, and retrieve against that embedding — catches documents
that match the answer space rather than the question space.

#### Backend

- [ ] Create `app/retrieval/query_expander.py`
  ```python
  from langchain.retrievers.multi_query import MultiQueryRetriever
  from langchain_openai import ChatOpenAI

  def build_multi_query_retriever(base_retriever, llm):
      return MultiQueryRetriever.from_llm(
          retriever=base_retriever,
          llm=llm
      )
  ```

- [ ] Create `app/retrieval/hyde.py`
  ```python
  from langchain.chains import HypotheticalDocumentEmbedder

  def build_hyde_retriever(vectorstore, llm, embeddings):
      hyde_embeddings = HypotheticalDocumentEmbedder.from_llm(
          llm=llm,
          base_embeddings=embeddings,
          custom_prompt=None   # uses default RAG-appropriate prompt
      )
      return vectorstore.as_retriever(embedding=hyde_embeddings)
  ```

- [ ] Add `query_expansion_enabled: bool` and `hyde_enabled: bool` to `RAGSettings`

- [ ] Conditionally wrap base retriever in multi-query or HyDE in `rag_chain.py`

#### Frontend

- [ ] Add two toggles to `SettingsForm`:
  - "Query expansion (multi-query)" — `query_expansion_enabled`
  - "HyDE retrieval" — `hyde_enabled`
- [ ] Add tooltip explaining the trade-off (latency +200ms, better recall)

---

### 1.4 Semantic Chunking

**What:** Instead of splitting documents every N tokens, split at natural semantic
boundaries (paragraphs, sections, topic shifts). Preserves context within chunks.

#### Backend

- [ ] Install dependencies
  ```
  pip install langchain-experimental
  ```

- [ ] Create `app/ingestion/chunker.py`
  ```python
  from langchain_experimental.text_splitter import SemanticChunker
  from langchain_openai import OpenAIEmbeddings
  from langchain.text_splitter import RecursiveCharacterTextSplitter

  def get_chunker(strategy: str, embeddings=None):
      if strategy == "semantic":
          return SemanticChunker(embeddings, breakpoint_threshold_type="percentile")
      elif strategy == "recursive":
          return RecursiveCharacterTextSplitter(
              chunk_size=512,
              chunk_overlap=64,
              separators=["\n\n", "\n", ".", " "]
          )
      else:
          raise ValueError(f"Unknown chunking strategy: {strategy}")
  ```

- [ ] Add `chunking_strategy: Literal["semantic", "recursive", "fixed"]` to `RAGSettings`

- [ ] Apply the correct chunker in the ingestion pipeline (`app/ingestion/pipeline.py`)

- [ ] Re-index endpoint: `POST /api/documents/:id/reindex` — re-chunks and re-embeds with current settings

#### Frontend

- [ ] Add "Chunking strategy" dropdown to `SettingsForm`
  - Options: Semantic (recommended), Recursive, Fixed size
- [ ] Show warning banner when chunking strategy changes:
  "Existing documents use a different strategy. Re-index to apply."
- [ ] Add "Re-index" button to each row in `DocumentTable`

---

### 1.5 Metadata Filtering

**What:** Allow users to scope retrieval to specific documents, date ranges, or
document types before running vector search. Avoids retrieving from stale or
irrelevant documents.

#### Backend

- [ ] Add metadata fields to document schema when ingesting:
  ```python
  metadata = {
      "document_id": doc_id,
      "filename": filename,
      "doc_type": file_extension,
      "uploaded_at": datetime.utcnow().isoformat(),
      "author": author or "unknown",
  }
  ```

- [ ] Update `POST /api/chat` request body to accept optional filters:
  ```python
  class ChatRequest(BaseModel):
      conversation_id: str
      message: str
      filters: dict | None = None
      # e.g. {"document_ids": ["doc_1", "doc_2"], "doc_type": "pdf"}
  ```

- [ ] Apply filter in retriever:
  ```python
  retriever = vectorstore.as_retriever(
      search_kwargs={
          "k": settings.top_k,
          "filter": build_filter(request.filters)
      }
  )
  ```

#### Frontend

- [ ] Add "Search scope" multi-select to `ChatInput` area (collapsed by default)
  - Checkbox list of uploaded documents from React Query cache
  - "All documents" (default) or selected subset
- [ ] Pass selected `document_ids` in `POST /api/chat` request body
- [ ] Show active filter chip above `ChatInput` when scope is narrowed

---

### 1.6 Multi-Query Retrieval

Covered by 1.3 (query expansion). Wire `MultiQueryRetriever` as the named implementation.

---

## Area 2 — Ingestion Pipeline

### 2.1 Multi-Format Parsing

**What:** Parse PDF (with layout), DOCX, HTML, CSV, Markdown natively.
Each format needs a dedicated loader to preserve structure.

#### Backend

- [ ] Install dependencies
  ```
  pip install pypdf python-docx beautifulsoup4 unstructured[pdf,docx]
  ```

- [ ] Create `app/ingestion/parsers.py`
  ```python
  from langchain_community.document_loaders import (
      PyPDFLoader,
      Docx2txtLoader,
      BSHTMLLoader,
      CSVLoader,
      UnstructuredMarkdownLoader,
  )

  LOADERS = {
      ".pdf":  lambda path: PyPDFLoader(path).load(),
      ".docx": lambda path: Docx2txtLoader(path).load(),
      ".html": lambda path: BSHTMLLoader(path).load(),
      ".htm":  lambda path: BSHTMLLoader(path).load(),
      ".csv":  lambda path: CSVLoader(path).load(),
      ".md":   lambda path: UnstructuredMarkdownLoader(path).load(),
      ".txt":  lambda path: open(path).read(),
  }

  def parse_document(file_path: str) -> list:
      ext = Path(file_path).suffix.lower()
      loader = LOADERS.get(ext)
      if not loader:
          raise ValueError(f"Unsupported file type: {ext}")
      return loader(file_path)
  ```

- [ ] Add accepted MIME types validation in `POST /api/upload` before saving to disk

- [ ] Return `parse_error` detail in document status when parsing fails

#### Frontend

- [ ] Update `FileUploader` accepted types:
  `.pdf,.docx,.html,.htm,.csv,.md,.txt`
- [ ] Show file type icon per extension in `DocumentTable`
- [ ] Show `parse_error` message in `StatusBadge` tooltip on Failed state

---

### 2.2 OCR + Table Extraction

**What:** Handle scanned PDFs (image-only) and extract tabular data as structured
text rather than raw whitespace-separated columns.

#### Backend

- [ ] Install dependencies
  ```
  pip install unstructured[all-docs] pytesseract pdf2image
  # System: apt-get install tesseract-ocr poppler-utils
  ```

- [ ] Create `app/ingestion/ocr.py`
  ```python
  from unstructured.partition.pdf import partition_pdf

  def extract_with_ocr(file_path: str) -> list[dict]:
      elements = partition_pdf(
          filename=file_path,
          strategy="hi_res",         # OCR mode
          infer_table_structure=True, # extract tables
          languages=["eng"],
      )
      return [{"type": el.category, "text": str(el)} for el in elements]
  ```

- [ ] Add OCR detection: if PDF has < 100 chars of extractable text per page → use OCR

- [ ] Represent extracted tables as Markdown table strings in chunk text

- [ ] Add `ocr_applied: bool` to document metadata (visible in Knowledge Base page detail)

#### Frontend

- [ ] Show "OCR" badge in `DocumentTable` row when `ocr_applied: true`
- [ ] Add tooltip: "This document was scanned. OCR was used to extract text."

---

### 2.3 Document Versioning

**What:** When a user uploads a document with the same name as an existing one,
create a new version rather than duplicating or silently overwriting.

#### Backend

- [ ] Add `version: int` and `parent_document_id: str | None` to document schema

- [ ] On upload: check if filename exists for this user
  - If yes → set `version = latest + 1`, `parent_document_id = original_id`
  - If no → `version = 1`, `parent_document_id = None`

- [ ] Add `GET /api/documents/:id/versions` — returns version history list

- [ ] When a new version is indexed, delete old version's vectors from the vectorstore
  using `vectorstore.delete(ids=[...old_chunk_ids])`

- [ ] Add `active_version_id` to document group so retrieval always uses the latest

#### Frontend

- [ ] Show version badge `v2`, `v3` in `DocumentTable` when `version > 1`
- [ ] Add "Version history" option in document row actions menu
- [ ] `VersionHistoryDrawer` — shows list of versions with upload date + status
- [ ] Allow restoring a previous version (sets it as `active_version_id`)

---

### 2.4 Async Ingestion Queue

**What:** Large file ingestion (parsing, chunking, embedding) blocks the upload
response. Move it to a background worker queue so the UI gets immediate feedback.

#### Backend

- [ ] Install dependencies
  ```
  pip install celery[redis] redis
  # or: pip install arq  (lightweight async alternative)
  ```

- [ ] Create `app/workers/ingestion_worker.py`
  ```python
  from celery import Celery
  from app.ingestion.pipeline import run_ingestion

  celery = Celery("rag", broker="redis://localhost:6379/0")

  @celery.task(bind=True, max_retries=3)
  def ingest_document(self, document_id: str, file_path: str, settings: dict):
      try:
          run_ingestion(document_id, file_path, settings)
      except Exception as exc:
          self.retry(exc=exc, countdown=30)
  ```

- [ ] `POST /api/upload` flow:
  1. Save file to disk / object storage
  2. Insert document record with `status = "processing"`
  3. Enqueue `ingest_document.delay(doc_id, file_path, settings)`
  4. Return `202 Accepted` with `{ document_id, status: "processing" }`

- [ ] Worker updates document status to `"ready"` or `"failed"` on completion

- [ ] `GET /api/documents/:id/status` — lightweight polling endpoint

#### Frontend

- [ ] Already partially covered — `StatusBadge` polling is specced
- [ ] Update polling interval to 3s; stop polling when status is `ready` or `failed`
- [ ] Show queue position if available: "Processing (2 ahead in queue)"

---

### 2.5 PII Detection + Redaction

**What:** Before indexing, scan document text for PII (emails, phone numbers,
national IDs, names in context) and redact or flag them.

#### Backend

- [ ] Install dependencies
  ```
  pip install presidio-analyzer presidio-anonymizer
  python -m spacy download en_core_web_lg
  ```

- [ ] Create `app/ingestion/pii.py`
  ```python
  from presidio_analyzer import AnalyzerEngine
  from presidio_anonymizer import AnonymizerEngine

  analyzer  = AnalyzerEngine()
  anonymizer = AnonymizerEngine()

  def redact_pii(text: str, entities: list[str] | None = None) -> tuple[str, list]:
      entities = entities or ["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON", "ID_NUMBER"]
      results = analyzer.analyze(text=text, language="en", entities=entities)
      redacted = anonymizer.anonymize(text=text, analyzer_results=results)
      return redacted.text, [r.entity_type for r in results]
  ```

- [ ] Run `redact_pii()` on each chunk before embedding

- [ ] Store `pii_entities_found: list[str]` in document metadata

- [ ] Add `pii_redaction_enabled: bool` to `RAGSettings` (default: `True`)

#### Frontend

- [ ] Show "PII redacted" badge in `DocumentTable` when `pii_entities_found` is non-empty
- [ ] Show which entity types were found in document detail view
- [ ] Add "PII redaction" toggle in `SettingsForm`

---

### 2.6 Data Source Connectors

**What:** Sync from Confluence, Notion, Google Drive, SharePoint instead of
manual file upload.

#### Backend

- [ ] Create `app/connectors/` module with base class:
  ```python
  class BaseConnector(ABC):
      @abstractmethod
      def list_documents(self) -> list[ConnectorDocument]: ...
      @abstractmethod
      def fetch_content(self, doc_id: str) -> str: ...
  ```

- [ ] Implement `ConfluenceConnector` using `langchain_community.document_loaders.ConfluenceLoader`

- [ ] Implement `NotionConnector` using `langchain_community.document_loaders.NotionDBLoader`

- [ ] `POST /api/connectors` — register a connector with credentials
- [ ] `POST /api/connectors/:id/sync` — trigger manual sync
- [ ] Background scheduler: sync all active connectors every N hours

#### Frontend

- [ ] Add "Connectors" tab to Knowledge Base page
- [ ] `ConnectorCard` — shows connector type, last sync time, document count, status
- [ ] "Add connector" modal with type selector + credentials form
- [ ] "Sync now" button per connector

---

## Area 3 — Answer Quality & Safety

### 3.1 Answer Grounding Check

**What:** After the LLM generates an answer, verify that each sentence is supported
by at least one retrieved chunk. Flag or suppress unsupported claims.

#### Backend

- [ ] Create `app/quality/grounding.py`
  ```python
  from langchain_openai import ChatOpenAI

  GROUNDING_PROMPT = """
  Given the context below and a generated answer, identify which sentences in the
  answer are NOT supported by the context. Return JSON: {"unsupported": ["sentence..."]}

  Context: {context}
  Answer: {answer}
  """

  async def check_grounding(answer: str, context: str, llm: ChatOpenAI) -> dict:
      result = await llm.ainvoke(GROUNDING_PROMPT.format(context=context, answer=answer))
      return parse_json(result.content)
  ```

- [ ] Run grounding check async after streaming completes (non-blocking)

- [ ] Add `grounding: { unsupported_count: int, fully_grounded: bool }` to `ChatResponse`

- [ ] Add `grounding_check_enabled: bool` to `RAGSettings`

#### Frontend

- [ ] Show grounding indicator on assistant message:
  - Green shield: "Fully grounded"
  - Yellow shield: "Some claims unverified"
- [ ] Tooltip lists unverified sentences when yellow

---

### 3.2 Input / Output Guardrails

**What:** Block off-topic queries before they reach the LLM. Filter toxic or
policy-violating outputs before they reach the user.

#### Backend

- [ ] Install dependencies
  ```
  pip install guardrails-ai
  # or: pip install llm-guard
  ```

- [ ] Create `app/safety/guardrails.py`
  ```python
  from llm_guard.input_scanners import Toxicity, PromptInjection, TokenLimit
  from llm_guard.output_scanners import NoRefusal, Relevance

  INPUT_SCANNERS  = [Toxicity(), PromptInjection(), TokenLimit(limit=1000)]
  OUTPUT_SCANNERS = [NoRefusal(), Relevance()]

  def scan_input(prompt: str) -> tuple[bool, str]:
      for scanner in INPUT_SCANNERS:
          sanitized, is_valid, _ = scanner.scan(prompt, prompt)
          if not is_valid:
              return False, scanner.__class__.__name__
      return True, ""

  def scan_output(prompt: str, output: str) -> tuple[bool, str]:
      for scanner in OUTPUT_SCANNERS:
          sanitized, is_valid, _ = scanner.scan(prompt, output)
          if not is_valid:
              return False, scanner.__class__.__name__
      return True, ""
  ```

- [ ] In `POST /api/chat`:
  1. Scan input → if blocked, return `400 { code: "INPUT_BLOCKED", reason: "..." }`
  2. Generate answer
  3. Scan output → if blocked, return safe fallback message

- [ ] Log all blocked requests to audit log (see Area 7.2)

#### Frontend

- [ ] Handle `INPUT_BLOCKED` response: show inline warning banner in `ChatWindow`
  "This query was blocked by content policy. Try rephrasing."
- [ ] Handle `OUTPUT_BLOCKED`: show "Response withheld" placeholder with a retry option

---

### 3.3 Confidence + No-Answer Fallback

**What:** When retrieved chunks score below a threshold, tell the user "I don't
have enough information" rather than hallucinating an answer.

#### Backend

- [ ] In retrieval step, compute `max_score = max(doc.metadata["score"] for doc in docs)`

- [ ] Add `confidence_threshold: float = 0.6` to `RAGSettings`

- [ ] If `max_score < threshold`:
  ```python
  return ChatResponse(
      answer="I don't have enough information in the knowledge base to answer this confidently.",
      sources=[],
      confidence="low",
      no_answer_reason="retrieval_score_below_threshold"
  )
  ```

- [ ] Add `confidence: Literal["high", "medium", "low"]` to `ChatResponse`

#### Frontend

- [ ] Add "Confidence threshold" slider to `SettingsForm` (0.0 → 1.0)
- [ ] Show confidence pill on each assistant message: high=green, medium=yellow, low=red
- [ ] Low confidence message has different styling: muted background, italic text
- [ ] Show "No answer" empty state illustration when `no_answer_reason` is set

---

### 3.4 Citation Accuracy Verification

**What:** Verify that each `[1]`, `[2]` citation in the answer actually matches
the content of the corresponding source chunk.

#### Backend

- [ ] Create `app/quality/citations.py`
  ```python
  async def verify_citations(answer: str, sources: list[Source], llm) -> list[dict]:
      results = []
      for i, source in enumerate(sources, 1):
          ref = f"[{i}]"
          if ref not in answer:
              continue
          prompt = f"""
          Does the following claim (marked with {ref}) match the source text?
          Answer only YES or NO.
          Claim context: {extract_claim_context(answer, ref)}
          Source: {source.chunk_text}
          """
          result = await llm.ainvoke(prompt)
          results.append({"citation": ref, "valid": "YES" in result.content.upper()})
      return results
  ```

- [ ] Add `citation_validity: list[{ citation: str, valid: bool }]` to `ChatResponse`

#### Frontend

- [ ] Style invalid citations `[1]` in red in `ChatMessage`
- [ ] Tooltip: "This citation may not accurately support the claim"
- [ ] Show citation validity summary in `SourcePanel` header

---

### 3.5 Prompt Injection Defence

**What:** Sanitise user queries and retrieved document chunks to prevent
injected instructions from overriding the system prompt.

#### Backend

- [ ] Create `app/safety/prompt_injection.py`
  ```python
  import re

  INJECTION_PATTERNS = [
      r"ignore (previous|above|all) instructions",
      r"you are now",
      r"disregard your",
      r"system prompt",
      r"act as",
  ]

  def sanitise_input(text: str) -> tuple[str, bool]:
      for pattern in INJECTION_PATTERNS:
          if re.search(pattern, text, re.IGNORECASE):
              return text, True   # flagged
      return text, False

  def sanitise_retrieved_chunk(chunk_text: str) -> str:
      # Wrap retrieved content so LLM treats it as data, not instructions
      return f"[RETRIEVED CONTENT START]\n{chunk_text}\n[RETRIEVED CONTENT END]"
  ```

- [ ] Call `sanitise_input()` on every user message before any LLM call

- [ ] Call `sanitise_retrieved_chunk()` on every chunk before context assembly

- [ ] Log injection attempts to audit log with severity level

#### Frontend

- [ ] No UI changes required — backend handles this transparently
- [ ] Admin observability: show "Injection attempt" event type in audit log viewer

---

## Area 4 — Evaluation & Quality Gates

### 4.1 RAGAS Automated Evaluation

**What:** Run RAGAS metrics (faithfulness, answer relevance, context precision,
context recall) after each response. Store results in Phoenix for trending.

#### Backend

- [ ] Install dependencies
  ```
  pip install ragas datasets
  ```

- [ ] Create `app/evaluation/ragas_eval.py`
  ```python
  from ragas import evaluate
  from ragas.metrics import faithfulness, answer_relevancy, context_precision
  from datasets import Dataset

  async def run_ragas(question: str, answer: str, contexts: list[str]) -> dict:
      data = {
          "question": [question],
          "answer": [answer],
          "contexts": [contexts],
      }
      dataset = Dataset.from_dict(data)
      result = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])
      return result.to_pandas().iloc[0].to_dict()
  ```

- [ ] Run RAGAS async after response is sent (background task, non-blocking):
  ```python
  background_tasks.add_task(run_ragas_and_store, question, answer, contexts, trace_id)
  ```

- [ ] Store RAGAS scores against `trace_id` in a `evaluations` table in PostgreSQL

- [ ] `GET /api/evaluations/:trace_id` — returns stored RAGAS scores

#### Frontend

- [ ] Update `EvalResults` component (from Phoenix spec) to show RAGAS scores:
  - Faithfulness, Answer relevance, Context precision — each as a progress bar + score
- [ ] Add RAGAS score trend chart to `ObservabilityPage` (7-day rolling average)

---

### 4.2 Golden Dataset + Regression Testing

**What:** Maintain a curated Q&A dataset. Run it against the pipeline on every
deploy and block if RAGAS scores drop below baseline.

#### Backend

- [ ] Create `app/evaluation/golden_dataset.py`
  ```python
  class GoldenQuestion(BaseModel):
      id: str
      question: str
      expected_answer: str     # reference answer for comparison
      relevant_document_ids: list[str]  # which docs should be retrieved
      min_faithfulness: float = 0.8
      min_relevance: float = 0.75
  ```

- [ ] `POST /api/evaluation/golden` — add a question to golden dataset
- [ ] `GET /api/evaluation/golden` — list all golden questions
- [ ] `POST /api/evaluation/run` — run full golden dataset, return pass/fail per question

- [ ] Create `scripts/eval_gate.py` — CLI script for CI:
  ```python
  # Exits with code 1 if any golden question fails thresholds
  result = requests.post("/api/evaluation/run").json()
  if result["failed_count"] > 0:
      print(f"FAILED: {result['failed_count']} golden questions below threshold")
      sys.exit(1)
  ```

#### Frontend (Admin)

- [ ] Add "Evaluation" section to `ObservabilityPage`:
  - Golden dataset table: question, last score, threshold, pass/fail badge
  - "Add to golden set" button from any conversation message (promotes a good Q&A pair)
  - "Run evaluation" button → triggers `POST /api/evaluation/run`
  - Results table with per-question scores

#### CI Integration

- [ ] Add eval gate step to GitHub Actions (backend CI):
  ```yaml
  - name: Run RAG eval gate
    run: python scripts/eval_gate.py
    env:
      API_BASE_URL: ${{ secrets.STAGING_API_URL }}
  ```

---

### 4.3 Human Feedback Loop

**What:** Thumbs up/down on each assistant message. Stored against `trace_id`.
Feeds into Phoenix for retrieval quality trending.

#### Backend

- [ ] Create `app/models/feedback.py`
  ```python
  class MessageFeedback(BaseModel):
      message_id: str
      conversation_id: str
      trace_id: str
      rating: Literal["positive", "negative"]
      comment: str | None = None
      created_at: datetime
  ```

- [ ] `POST /api/feedback` — store feedback, link to trace
  ```python
  @router.post("/feedback")
  async def submit_feedback(feedback: MessageFeedback, db: Session = Depends(get_db)):
      db.add(FeedbackRecord(**feedback.dict()))
      db.commit()
      # Also push to Phoenix as an eval annotation
      phoenix_client.annotate_span(trace_id=feedback.trace_id, label=feedback.rating)
      return {"status": "ok"}
  ```

- [ ] `GET /api/feedback/stats` — returns positive/negative ratio by time period

#### Frontend

- [ ] Add `FeedbackButtons` to each assistant `ChatMessage`
  - Thumbs up / thumbs down — only one can be selected
  - Optional: "Tell us more" textarea appears after thumbs down (max 200 chars)
  - Submitted state: button fills, disabled, shows "Thanks for your feedback"
- [ ] Store optimistic feedback state in `chatStore`
- [ ] Add feedback ratio chart to `ObservabilityPage`

---

### 4.4 A/B Retrieval Experiments

**What:** Run two retrieval configurations side-by-side for the same query and
compare RAGAS scores. Used to test chunk size, top-K, model changes before rolling out.

#### Backend

- [ ] Create `app/evaluation/experiment.py`
  ```python
  class ExperimentConfig(BaseModel):
      name: str
      settings_a: RAGSettings
      settings_b: RAGSettings
      question_ids: list[str]  # golden dataset IDs to test

  async def run_experiment(config: ExperimentConfig) -> ExperimentResult:
      results_a = await run_eval_batch(config.settings_a, config.question_ids)
      results_b = await run_eval_batch(config.settings_b, config.question_ids)
      return ExperimentResult(config=config, results_a=results_a, results_b=results_b)
  ```

- [ ] `POST /api/experiments` — create and run experiment
- [ ] `GET /api/experiments` — list past experiments
- [ ] `GET /api/experiments/:id` — full results with per-question comparison

#### Frontend

- [ ] Add "Experiments" tab to `ObservabilityPage`
- [ ] `ExperimentForm` — side-by-side settings picker (Config A vs Config B)
- [ ] `ExperimentResultTable` — per-question score comparison, winner highlighted

---

## Area 5 — Performance & Cost

### 5.1 Semantic Cache

**What:** For near-duplicate queries (cosine similarity > 0.97), return the
cached answer without calling the LLM. Reduces cost and latency.

#### Backend

- [ ] Install dependencies
  ```
  pip install gptcache
  # or implement manually with Redis + embedding similarity
  ```

- [ ] Create `app/cache/semantic_cache.py`
  ```python
  import redis
  import numpy as np
  from openai import OpenAI

  class SemanticCache:
      def __init__(self, redis_url: str, threshold: float = 0.97):
          self.redis = redis.from_url(redis_url)
          self.threshold = threshold
          self.client = OpenAI()

      def get(self, query: str) -> str | None:
          query_emb = self._embed(query)
          for key in self.redis.scan_iter("cache:*"):
              entry = json.loads(self.redis.get(key))
              similarity = cosine_sim(query_emb, entry["embedding"])
              if similarity >= self.threshold:
                  return entry["answer"]
          return None

      def set(self, query: str, answer: str, ttl: int = 3600):
          key = f"cache:{uuid4()}"
          embedding = self._embed(query)
          self.redis.setex(key, ttl, json.dumps({"embedding": embedding, "answer": answer}))
  ```

- [ ] In `POST /api/chat` handler:
  1. Check cache → if hit, return cached answer with `cache_hit: true`
  2. If miss → run RAG pipeline → store result in cache

- [ ] Add `cache_hit: bool` to `ChatResponse`

- [ ] Add `GET /api/cache/stats` — hit rate, entry count, estimated cost savings

#### Frontend

- [ ] Show "Cached" pill on assistant message when `cache_hit: true`
  - Tooltip: "This answer was retrieved from cache"
- [ ] Add cache hit rate stat card to `ObservabilityPage`

---

### 5.2 Token Budget Management

**What:** Dynamically trim the context window: if retrieved chunks + conversation
history exceed the model's limit, truncate intelligently (most relevant chunks first).

#### Backend

- [ ] Create `app/context/assembler.py`
  ```python
  import tiktoken

  def assemble_context(
      chunks: list[Document],
      conversation_history: list[Message],
      system_prompt: str,
      max_tokens: int = 3000,
      model: str = "gpt-4o"
  ) -> str:
      enc = tiktoken.encoding_for_model(model)

      system_tokens = len(enc.encode(system_prompt))
      history_tokens = sum(len(enc.encode(m.content)) for m in conversation_history)
      available = max_tokens - system_tokens - history_tokens - 200  # 200 for answer headroom

      assembled = []
      used = 0
      for chunk in chunks:  # already sorted by rerank score descending
          chunk_tokens = len(enc.encode(chunk.page_content))
          if used + chunk_tokens > available:
              break
          assembled.append(chunk)
          used += chunk_tokens

      return "\n\n".join(c.page_content for c in assembled)
  ```

- [ ] Log `tokens_used`, `tokens_available`, `chunks_included`, `chunks_dropped` to span

- [ ] Add `context_assembly` span to Phoenix trace

#### Frontend

- [ ] Show token usage bar in `SourcePanel` footer:
  "Context used: 1,842 / 3,000 tokens  (3 of 5 chunks included)"

---

### 5.3 Per-Query Cost Tracking

**What:** Log LLM token usage and estimated cost per query, per user, per conversation.

#### Backend

- [ ] Create `app/billing/cost_tracker.py`
  ```python
  COST_PER_1K = {
      "gpt-4o":              {"input": 0.005, "output": 0.015},
      "gpt-4o-mini":         {"input": 0.00015, "output": 0.0006},
      "claude-3-5-sonnet":   {"input": 0.003, "output": 0.015},
  }

  def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
      rates = COST_PER_1K.get(model, {"input": 0, "output": 0})
      return (input_tokens / 1000 * rates["input"]) + (output_tokens / 1000 * rates["output"])
  ```

- [ ] After each LLM call, log to `query_costs` table:
  `user_id, conversation_id, trace_id, model, input_tokens, output_tokens, cost_usd, timestamp`

- [ ] `GET /api/costs/summary` — admin endpoint, returns:
  ```json
  { "total_usd": 12.40, "by_user": [...], "by_model": [...], "by_day": [...] }
  ```

#### Frontend

- [ ] Add "Cost" tab to `ObservabilityPage` (admin only)
  - Total spend (last 7 / 30 days)
  - Cost per user table
  - Cost per model bar chart
  - Daily spend line chart

---

### 5.4 Model Routing

**What:** Route simple queries to a cheap fast model and complex queries to
a frontier model. Classify query complexity before routing.

#### Backend

- [ ] Create `app/routing/model_router.py`
  ```python
  from langchain_openai import ChatOpenAI

  ROUTER_PROMPT = """
  Classify this query as SIMPLE or COMPLEX.
  SIMPLE: factual lookup, single-hop, short answer expected.
  COMPLEX: multi-step reasoning, comparison, synthesis required.
  Query: {query}
  Answer only SIMPLE or COMPLEX.
  """

  class ModelRouter:
      def __init__(self, simple_model="gpt-4o-mini", complex_model="gpt-4o"):
          self.simple = ChatOpenAI(model=simple_model, temperature=0)
          self.complex = ChatOpenAI(model=complex_model, temperature=0)
          self.classifier = ChatOpenAI(model="gpt-4o-mini", temperature=0)

      async def route(self, query: str) -> ChatOpenAI:
          result = await self.classifier.ainvoke(ROUTER_PROMPT.format(query=query))
          return self.simple if "SIMPLE" in result.content else self.complex
  ```

- [ ] Add `model_routing_enabled: bool` to `RAGSettings`

- [ ] Add `routed_to_model: str` to `ChatResponse` and Phoenix span

#### Frontend

- [ ] Show routed model name in `ChatMessage` meta row (small text, next to latency)
- [ ] Add "Model routing" toggle to `SettingsForm`

---

## Area 6 — UX & Conversation

### 6.1 Multi-Turn Memory

**What:** Inject a summary of recent conversation history as context so the
LLM understands follow-up questions ("what about the second point?").

#### Backend

- [ ] Create `app/memory/conversation_memory.py`
  ```python
  from langchain.memory import ConversationSummaryBufferMemory
  from langchain_openai import ChatOpenAI

  class ConversationMemoryManager:
      def __init__(self, llm: ChatOpenAI, max_token_limit: int = 1000):
          self.memory = ConversationSummaryBufferMemory(
              llm=llm,
              max_token_limit=max_token_limit,
              return_messages=True,
          )

      def add_turn(self, human: str, ai: str):
          self.memory.save_context({"input": human}, {"output": ai})

      def get_context(self) -> str:
          return self.memory.load_memory_variables({}).get("history", "")
  ```

- [ ] Persist memory buffer to Redis keyed by `conversation_id`
  ```python
  def save_memory(conversation_id: str, memory_dict: dict):
      redis.setex(f"memory:{conversation_id}", 86400, json.dumps(memory_dict))
  ```

- [ ] Inject `conversation_context` into system prompt in `rag_chain.py`

- [ ] Add `memory_window: int = 10` (number of turns) to `RAGSettings`

#### Frontend

- [ ] Add "Memory window" input to `SettingsForm` (number, 1–20 turns)
- [ ] Show "Memory active" indicator in `ChatInput` area when conversation has history

---

### 6.2 Suggested Follow-Up Questions

**What:** After each answer, generate 3 context-aware follow-up questions
the user might want to ask next.

#### Backend

- [ ] Create `app/generation/followups.py`
  ```python
  FOLLOWUP_PROMPT = """
  Given this Q&A, suggest 3 concise follow-up questions a user might ask.
  Return JSON array only: ["question 1", "question 2", "question 3"]

  Question: {question}
  Answer: {answer}
  """

  async def generate_followups(question: str, answer: str, llm) -> list[str]:
      result = await llm.ainvoke(FOLLOWUP_PROMPT.format(question=question, answer=answer))
      return json.loads(result.content)
  ```

- [ ] Run async after streaming completes (background task)

- [ ] Add `suggested_followups: list[str]` to `ChatResponse`

#### Frontend

- [ ] Show 3 pill buttons below each assistant message
  - Clicking a pill prefills `ChatInput` and auto-sends
- [ ] Animate in after a 500ms delay (after stream ends)
- [ ] Hide when user has already typed a new message

---

### 6.3 Export / Share Answer

**What:** Download a conversation as Markdown or PDF. Generate a shareable link.

#### Backend

- [ ] `GET /api/conversations/:id/export?format=md` — returns Markdown file

- [ ] `GET /api/conversations/:id/export?format=pdf` — generates PDF via WeasyPrint
  ```python
  from weasyprint import HTML
  def export_pdf(conversation: Conversation) -> bytes:
      html = render_conversation_html(conversation)
      return HTML(string=html).write_pdf()
  ```

- [ ] `POST /api/conversations/:id/share` — creates a shareable token
  - `GET /share/:token` — public endpoint, renders read-only conversation

#### Frontend

- [ ] Add export dropdown to conversation header:
  - "Download as Markdown"
  - "Download as PDF"
  - "Copy shareable link"
- [ ] Shareable link opens a read-only `/share/:token` page (no auth required)

---

### 6.4 Conversation Search

**What:** Full-text search across all past conversations.

#### Backend

- [ ] Add full-text index on `messages.content` in PostgreSQL:
  ```sql
  CREATE INDEX messages_content_fts ON messages USING gin(to_tsvector('english', content));
  ```

- [ ] `GET /api/conversations/search?q=query` — returns matching conversations
  with highlighted snippets

#### Frontend

- [ ] Add search icon button at top of `ConversationList` sidebar
- [ ] Expands into a search input; results appear inline in sidebar
- [ ] Each result shows: conversation title, message snippet with query highlighted
- [ ] Clicking a result navigates to that conversation and scrolls to the matching message

---

## Area 7 — Observability & Governance

### 7.1 Audit Log

**What:** Immutable record of every query, which documents were retrieved,
what answer was given, by whom and when.

#### Backend

- [ ] Create `app/models/audit.py`
  ```python
  class AuditEvent(BaseModel):
      id: str
      event_type: Literal["chat", "upload", "delete", "login", "blocked_input", "injection_attempt"]
      user_id: str
      user_email: str
      timestamp: datetime
      ip_address: str
      payload: dict  # event-specific data
      trace_id: str | None
  ```

- [ ] Write to `audit_events` table on every action (never update, never delete)

- [ ] `GET /api/audit?user_id=&event_type=&from=&to=` — admin-only paginated log

- [ ] Export: `GET /api/audit/export?format=csv`

#### Frontend

- [ ] Add "Audit log" section to `ObservabilityPage` (admin only)
- [ ] `AuditTable` — columns: timestamp, user, event type, summary, trace link
- [ ] Filter by user, event type, date range
- [ ] "Export CSV" button
- [ ] Event type badges: chat=blue, blocked=red, upload=green, login=gray

---

### 7.2 Data Retention Policy

**What:** Automatically delete conversation history older than a configured TTL.
Handle right-to-erasure (GDPR Article 17) requests.

#### Backend

- [ ] Add `conversation_retention_days: int = 90` to `RAGSettings`

- [ ] Background job (runs nightly):
  ```python
  @celery.task
  def purge_expired_conversations():
      cutoff = datetime.utcnow() - timedelta(days=settings.conversation_retention_days)
      db.query(Conversation).filter(Conversation.created_at < cutoff).delete()
  ```

- [ ] `DELETE /api/users/:id/data` — admin endpoint, erases all user data:
  conversations, messages, feedback, uploads, audit entries for that user

- [ ] Log erasure to a separate compliance log (must survive the erasure)

#### Frontend

- [ ] Add "Data retention" field to `SettingsForm`: retention period in days
- [ ] Add "Request data erasure" button to user profile page (for users)
- [ ] Admin: erasure request queue in User Management page

---

### 7.3 Document-Level ACL

**What:** Beyond role-based access, restrict which users or groups can retrieve
from specific documents.

#### Backend

- [ ] Create `document_acl` table:
  ```sql
  CREATE TABLE document_acl (
      document_id UUID REFERENCES documents(id),
      principal_type VARCHAR(10),  -- 'user' or 'role'
      principal_id UUID,
      can_read BOOLEAN DEFAULT TRUE,
      PRIMARY KEY (document_id, principal_type, principal_id)
  );
  ```

- [ ] On retrieval: filter retrieved chunks to only those from documents the user can read
  ```python
  accessible_doc_ids = get_accessible_documents(user_id, user_role)
  retriever = vectorstore.as_retriever(
      search_kwargs={"filter": {"document_id": {"$in": accessible_doc_ids}}}
  )
  ```

- [ ] `PUT /api/documents/:id/acl` — admin sets who can read a document

#### Frontend

- [ ] Add "Access control" panel in document detail view (admin only)
  - "Accessible to": All users / Specific roles / Specific users
  - User/role multi-select
- [ ] Documents with restricted ACL show a lock icon in `DocumentTable`

---

## Dependency Map

```
Area 1 (Retrieval)    →  requires: Area 2.1 (parsers), Area 2.4 (async queue)
Area 3.1 (grounding)  →  requires: Area 1 (retrieval working first)
Area 4.1 (RAGAS)      →  requires: Area 3.1 + Phoenix integration
Area 4.2 (golden set) →  requires: Area 4.1 (RAGAS scores to compare)
Area 4.3 (feedback)   →  requires: Phoenix integration
Area 5.1 (cache)      →  requires: Redis (also needed for Area 2.4 queue)
Area 5.3 (cost)       →  requires: Area 5.2 (token tracking)
Area 6.1 (memory)     →  requires: Redis
Area 7.1 (audit)      →  requires: auth (user_id available)
Area 7.3 (doc ACL)    →  requires: Area 7.1 + RBAC
```

---

## Recommended Sprint Order

| Sprint | Backend | Frontend |
|---|---|---|
| 2 (current) | Auth + RBAC + basic RAG chain | Login, protected routes, RBAC nav |
| 3 | Hybrid search + reranking + semantic chunking | Settings sliders for these |
| 3 | Async queue + multi-format parsing | StatusBadge polling |
| 3 | Multi-turn memory | Memory indicator in ChatInput |
| 4 | Guardrails + grounding + confidence fallback | Grounding badge, no-answer state |
| 4 | Semantic cache + token budget | Cache pill, token bar in SourcePanel |
| 4 | Human feedback loop | Thumbs up/down on messages |
| 5 | RAGAS evals + golden dataset | ObservabilityPage eval section |
| 5 | Audit log + data retention | Audit table, retention settings |
| 5 | Per-query cost tracking | Cost tab in ObservabilityPage |
| 6 | PII redaction + prompt injection | PII badge, blocked input banner |
| 6 | Model routing | Routed model label on messages |
| 6 | Suggested follow-ups + conversation search | Follow-up pills, sidebar search |
| 7 | Document-level ACL | ACL panel in document detail |
| 7 | A/B experiments | Experiments tab |
| 7 | Data source connectors | Connectors tab in Knowledge Base |
| 8 | Export / share conversation | Export dropdown, share link |
| 8 | Document versioning + re-index | Version history drawer, re-index button |
| 8 | OCR + table extraction | OCR badge in DocumentTable |
| 8 | Citation accuracy verification | Red citation styling |
