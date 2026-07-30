import { VectorSearchProvider } from './vectorSearchProvider';
import { VectorChunk, VectorSearchResult } from '../../types';
import { config } from '../../config/environment';

export class OpenSearchProvider implements VectorSearchProvider {
  async search(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    const response = await fetch(`${config.API_BASE_URL}/opensearch/knn-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK })
    });
    const res = await response.json();
    if (!res.success) throw new Error(res.error?.message || 'OpenSearch query failed');
    return res.data;
  }

  async addChunk(chunk: VectorChunk): Promise<void> {
    await fetch(`${config.API_BASE_URL}/opensearch/index-chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunk })
    });
  }
}
