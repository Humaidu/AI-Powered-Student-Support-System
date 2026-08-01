import { VectorSearchProvider } from './vectorSearchProvider';
import { VectorChunk, VectorSearchResult } from '../../types';
import { apiClient } from '../../api/client';

export class OpenSearchProvider implements VectorSearchProvider {
  async search(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    const res = await apiClient<VectorSearchResult[]>('/opensearch/knn-search', {
      method: 'POST',
      body: JSON.stringify({ query, topK })
    });
    if (!res.success) throw new Error(res.error?.message || 'OpenSearch query failed');
    return res.data || [];
  }

  async addChunk(chunk: VectorChunk): Promise<void> {
    const res = await apiClient<null>('/opensearch/index-chunk', {
      method: 'POST',
      body: JSON.stringify({ chunk })
    });
    if (!res.success) throw new Error(res.error?.message || 'Failed to index chunk');
  }
}
