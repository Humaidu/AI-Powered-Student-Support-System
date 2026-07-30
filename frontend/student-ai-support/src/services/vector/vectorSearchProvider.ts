import { VectorChunk, VectorSearchResult } from '../../types';

export interface VectorSearchProvider {
  search(query: string, topK?: number): Promise<VectorSearchResult[]>;
  addChunk(chunk: VectorChunk): Promise<void>;
}
