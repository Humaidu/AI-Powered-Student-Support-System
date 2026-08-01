import { AIProvider, AIResponse } from './aiProvider';
import { VectorChunk } from '../../types';
import { apiClient } from '../../api/client';

export class BedrockProvider implements AIProvider {
  async generateAnswer(prompt: string, contextChunks: VectorChunk[]): Promise<AIResponse> {
    const res = await apiClient<AIResponse>('/bedrock/invoke', {
      method: 'POST',
      body: JSON.stringify({ prompt, contextChunks })
    });
    if (!res.success) throw new Error(res.error?.message || 'Bedrock invocation failed');
    if (!res.data) throw new Error('Bedrock invocation returned no data');
    return res.data;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await apiClient<{ embedding: number[] }>('/bedrock/embeddings', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    if (!res.success) throw new Error(res.error?.message || 'Embedding generation failed');
    if (!res.data?.embedding) throw new Error('Embedding response is missing vector data');
    return res.data.embedding;
  }
}
