import type { Conversation, Message, Source } from "../../types";

export const MOCK_SOURCES: Source[] = [
  {
    documentId: "doc_1",
    documentName: "Product Requirements Q3.pdf",
    chunkText:
      "The system shall support document upload in PDF, DOCX, TXT, and Markdown formats. Maximum file size is 50MB per document.",
    pageNumber: 3,
    relevanceScore: 0.92,
  },
  {
    documentId: "doc_2",
    documentName: "API Reference v2.docx",
    chunkText:
      'The /api/documents endpoint accepts POST requests with multipart/form-data encoding. The file must be sent as the "file" field.',
    pageNumber: 12,
    relevanceScore: 0.88,
  },
  {
    documentId: "doc_3",
    documentName: "Architecture Overview.md",
    chunkText:
      "The RAG pipeline consists of three stages: document ingestion, embedding generation, and semantic retrieval. Chunk size is configurable per deployment.",
    relevanceScore: 0.85,
  },
  {
    documentId: "doc_1",
    documentName: "Product Requirements Q3.pdf",
    chunkText:
      "Authentication must use JWT tokens with a 24-hour expiry. Refresh tokens are not required for the initial implementation phase.",
    pageNumber: 7,
    relevanceScore: 0.78,
  },
  {
    documentId: "doc_4",
    documentName: "Deployment Guide.txt",
    chunkText:
      "To deploy on Vercel, set the VITE_API_BASE_URL environment variable in your project settings. MSW is automatically disabled in production builds.",
    relevanceScore: 0.71,
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    title: "Document upload requirements",
    createdAt: "2024-11-01T09:00:00Z",
    updatedAt: "2024-11-01T09:15:00Z",
  },
  {
    id: "conv_2",
    title: "API authentication flow",
    createdAt: "2024-10-28T14:30:00Z",
    updatedAt: "2024-10-28T14:45:00Z",
  },
  {
    id: "conv_3",
    title: "Vercel deployment config",
    createdAt: "2024-10-20T11:00:00Z",
    updatedAt: "2024-10-20T11:20:00Z",
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  conv_1: [
    {
      id: "msg_1_1",
      conversationId: "conv_1",
      role: "user",
      content: "What file formats does the system support for upload?",
      createdAt: "2024-11-01T09:00:00Z",
    },
    {
      id: "msg_1_2",
      conversationId: "conv_1",
      role: "assistant",
      content:
        "The system supports PDF, DOCX, TXT, and Markdown formats for document upload. The maximum file size is 50MB per document.",
      sources: [MOCK_SOURCES[0]],
      createdAt: "2024-11-01T09:01:00Z",
    },
    {
      id: "msg_1_3",
      conversationId: "conv_1",
      role: "user",
      content: "How do I upload a document via the API?",
      createdAt: "2024-11-01T09:10:00Z",
    },
    {
      id: "msg_1_4",
      conversationId: "conv_1",
      role: "assistant",
      content:
        'Send a POST request to /api/documents with multipart/form-data encoding. The file must be included as the "file" field in the form data.',
      sources: [MOCK_SOURCES[1]],
      createdAt: "2024-11-01T09:15:00Z",
    },
  ],
  conv_2: [
    {
      id: "msg_2_1",
      conversationId: "conv_2",
      role: "user",
      content: "How does authentication work in this system?",
      createdAt: "2024-10-28T14:30:00Z",
    },
    {
      id: "msg_2_2",
      conversationId: "conv_2",
      role: "assistant",
      content:
        "The system uses JWT tokens for authentication. After a successful login, you receive an access token valid for 24 hours. Include it as a Bearer token in the Authorization header for all protected API calls.",
      sources: [MOCK_SOURCES[3]],
      createdAt: "2024-10-28T14:32:00Z",
    },
    {
      id: "msg_2_3",
      conversationId: "conv_2",
      role: "user",
      content: "Is refresh token support planned?",
      createdAt: "2024-10-28T14:40:00Z",
    },
    {
      id: "msg_2_4",
      conversationId: "conv_2",
      role: "assistant",
      content:
        "Refresh tokens are not included in the initial implementation. The current design prioritises simplicity and can be extended with refresh token support when needed.",
      sources: [MOCK_SOURCES[3]],
      createdAt: "2024-10-28T14:45:00Z",
    },
  ],
  conv_3: [
    {
      id: "msg_3_1",
      conversationId: "conv_3",
      role: "user",
      content: "How do I deploy the frontend on Vercel?",
      createdAt: "2024-10-20T11:00:00Z",
    },
    {
      id: "msg_3_2",
      conversationId: "conv_3",
      role: "assistant",
      content:
        "To deploy on Vercel, configure the VITE_API_BASE_URL environment variable in your project settings. MSW is automatically disabled in production builds, so no additional setup is required for the mock layer.",
      sources: [MOCK_SOURCES[4]],
      createdAt: "2024-10-20T11:10:00Z",
    },
    {
      id: "msg_3_3",
      conversationId: "conv_3",
      role: "user",
      content: "What is the RAG pipeline architecture?",
      createdAt: "2024-10-20T11:15:00Z",
    },
    {
      id: "msg_3_4",
      conversationId: "conv_3",
      role: "assistant",
      content:
        "The RAG pipeline consists of three stages: document ingestion (parsing and chunking), embedding generation (vectorisation via an LLM embedding model), and semantic retrieval (top-K similarity search). Chunk size is configurable per deployment.",
      sources: [MOCK_SOURCES[2]],
      createdAt: "2024-10-20T11:20:00Z",
    },
  ],
};
