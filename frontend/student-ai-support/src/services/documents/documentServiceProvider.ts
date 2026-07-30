import { Document, ApprovalStatus } from '../../types';

export interface DocumentServiceProvider {
  getDocuments(): Promise<Document[]>;
  uploadDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document>;
  approveDocument(documentId: string, status: ApprovalStatus): Promise<Document>;
  deleteDocument(documentId: string): Promise<void>;
}
