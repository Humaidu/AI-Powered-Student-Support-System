import { AIProvider, AIResponse } from './aiProvider';
import { VectorChunk } from '../../types';
import { config } from '../../config/environment';

export class BedrockProvider implements AIProvider {
  async generateAnswer(prompt: string, contextChunks: VectorChunk[]): Promise<AIResponse> {
    const response = await fetch(`${config.API_BASE_URL}/bedrock/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, contextChunks })
    });
    const res = await response.json();
    if (!res.success) throw new Error(res.error?.message || 'Bedrock invocation failed');
    return res.data;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${config.API_BASE_URL}/bedrock/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const res = await response.json();
    return res.data.embedding;
  }
}
