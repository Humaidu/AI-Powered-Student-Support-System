import { LocalVectorProvider } from './localVectorProvider';
import { OpenSearchProvider } from './openSearchProvider';
import { VectorSearchProvider } from './vectorSearchProvider';
import { VectorChunk, VectorSearchResult } from '../../types';
import { config } from '../../config/environment';

class VectorSearchService {
  private provider: VectorSearchProvider;

  constructor() {
    if (config.APP_MODE === 'aws') {
      this.provider = new OpenSearchProvider();
    } else {
      this.provider = new LocalVectorProvider();
    }
  }

  public async search(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    return this.provider.search(query, topK);
  }

  public async addChunk(chunk: VectorChunk): Promise<void> {
    return this.provider.addChunk(chunk);
  }
}

export const vectorSearchService = new VectorSearchService();
