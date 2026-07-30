import { DocumentServiceProvider } from './documentServiceProvider';
import { Document, ApprovalStatus } from '../../types';
import { config } from '../../config/environment';

export class S3DocumentService implements DocumentServiceProvider {
  async getDocuments(): Promise<Document[]> {
    const res = await fetch(`${config.API_BASE_URL}/documents`);
    const json = await res.json();
    return json.data;
  }

  async uploadDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const res = await fetch(`${config.API_BASE_URL}/documents`, {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    return json.data;
  }

  async approveDocument(documentId: string, status: ApprovalStatus): Promise<Document> {
    const res = await fetch(`${config.API_BASE_URL}/documents/${documentId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    return json.data;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await fetch(`${config.API_BASE_URL}/documents/${documentId}`, { method: 'DELETE' });
  }
}
