export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string; // e.g. "UNDERGRADUATE", "DEAN OF FACULTY"
  avatar: string;
  department?: string;
  token: string;
}

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'EMBEDDING' | 'COMPLETED' | 'FAILED';
export type ApprovalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DocumentMetadata {
  category: string;
  department: string;
  author: string;
  version: string;
  pageCount: number;
  uploadedAt: string;
  fileSize: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  status: DocumentStatus;
  approvalStatus: ApprovalStatus;
  metadata: DocumentMetadata;
}

export interface SourceReference {
  document: string;
  documentId?: string;
  page: string | number;
  section: string;
  confidence: number; // e.g. 0.98 -> 98%
  snippet?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  sender: 'student' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceReference[];
  ragVerification?: {
    sourceCount: number;
    sources: SourceReference[];
  };
  suggestedFollowups?: string[];
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  category: 'Academic' | 'Housing' | 'Finance' | 'Research' | 'Student Affairs' | 'Operations' | 'Legal' | 'General';
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  model: string; // e.g. "GPT-4o + RAG Model (Bedrock Simulated)"
}

export interface VectorChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  embedding: number[];
  metadata: {
    pageNumber: number;
    section: string;
    documentVersion: string;
  };
}

export interface VectorSearchResult {
  chunk: VectorChunk;
  similarity: number;
}

export type ActivityEventType = 
  | 'DOCUMENT_UPLOADED' 
  | 'DOCUMENT_APPROVED' 
  | 'DOCUMENT_DELETED' 
  | 'AI_RESPONSE_GENERATED' 
  | 'USER_LOGIN'
  | 'SUPPORT_TICKET_CREATED';

export interface AuditLog {
  id: string;
  eventType: ActivityEventType;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  timestamp: string;
}

export interface Feedback {
  id: string;
  messageId: string;
  type: 'helpful' | 'unhelpful';
  comments?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
