import { MockDocumentService } from './mockDocumentService';
import { S3DocumentService } from './s3DocumentService';
import { DocumentServiceProvider } from './documentServiceProvider';
import { Document, ApprovalStatus } from '../../types';
import { config } from '../../config/environment';

class DocumentService {
  private provider: DocumentServiceProvider;

  constructor() {
    if (config.APP_MODE === 'aws') {
      this.provider = new S3DocumentService();
    } else {
      this.provider = new MockDocumentService();
    }
  }

  public async getDocuments(): Promise<Document[]> {
    return this.provider.getDocuments();
  }

  public async uploadDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document> {
    return this.provider.uploadDocument(file, metadata);
  }

  public async approveDocument(documentId: string, status: ApprovalStatus): Promise<Document> {
    return this.provider.approveDocument(documentId, status);
  }

  public async deleteDocument(documentId: string): Promise<void> {
    return this.provider.deleteDocument(documentId);
  }
}

export const documentService = new DocumentService();
