import { DocumentServiceProvider } from './documentServiceProvider';
import { Document, ApprovalStatus } from '../../types';
import initialDocs from '../../mock/documents.json';
import { vectorSearchService } from '../vector/vectorSearchService';

const DOCS_STORAGE_KEY = 'hypervisor_documents';

export class MockDocumentService implements DocumentServiceProvider {
  private getStoredDocs(): Document[] {
    const stored = localStorage.getItem(DOCS_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(initialDocs));
    return initialDocs as Document[];
  }

  private saveDocs(docs: Document[]): void {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
  }

  async getDocuments(): Promise<Document[]> {
    await new Promise(res => setTimeout(res, 200));
    return this.getStoredDocs();
  }

  async uploadDocument(file: File, metadataOverride?: Partial<Document['metadata']>): Promise<Document> {
    const docs = this.getStoredDocs();

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      status: 'UPLOADED',
      approvalStatus: 'PENDING_REVIEW',
      metadata: {
        category: metadataOverride?.category || 'General Administration',
        department: metadataOverride?.department || 'Academic Affairs',
        author: metadataOverride?.author || 'Faculty Member',
        version: metadataOverride?.version || 'v1.0',
        pageCount: Math.floor(Math.random() * 25) + 5,
        uploadedAt: new Date().toISOString(),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }
    };

    docs.unshift(newDoc);
    this.saveDocs(docs);

    // Simulate ingestion pipeline asynchronously (UPLOADED -> PROCESSING -> EMBEDDING -> COMPLETED)
    setTimeout(async () => {
      const currentDocs = this.getStoredDocs();
      const target = currentDocs.find(d => d.id === newDoc.id);
      if (target) {
        target.status = 'PROCESSING';
        this.saveDocs(currentDocs);
      }
    }, 1200);

    setTimeout(async () => {
      const currentDocs = this.getStoredDocs();
      const target = currentDocs.find(d => d.id === newDoc.id);
      if (target) {
        target.status = 'EMBEDDING';
        this.saveDocs(currentDocs);
      }
    }, 2800);

    setTimeout(async () => {
      const currentDocs = this.getStoredDocs();
      const target = currentDocs.find(d => d.id === newDoc.id);
      if (target) {
        target.status = 'COMPLETED';
        this.saveDocs(currentDocs);

        // Add chunk embedding to vector search service
        await vectorSearchService.addChunk({
          chunkId: `chk-${Date.now()}`,
          documentId: target.id,
          documentTitle: target.title,
          content: `${target.title}: Institutional document detailing policies, rules, and procedures regarding ${target.metadata.category} for ${target.metadata.department}.`,
          embedding: [0.25, 0.35, 0.15, -0.20, 0.40, 0.10, 0.30, -0.15, 0.50, 0.05],
          metadata: {
            pageNumber: 1,
            section: 'Section 1.0: Executive Overview',
            documentVersion: target.metadata.version
          }
        });
      }
    }, 4500);

    return newDoc;
  }

  async approveDocument(documentId: string, status: ApprovalStatus): Promise<Document> {
    const docs = this.getStoredDocs();
    const target = docs.find(d => d.id === documentId);
    if (target) {
      target.approvalStatus = status;
      this.saveDocs(docs);
      return target;
    }
    throw new Error('Document not found');
  }

  async deleteDocument(documentId: string): Promise<void> {
    const docs = this.getStoredDocs().filter(d => d.id !== documentId);
    this.saveDocs(docs);
  }
}
