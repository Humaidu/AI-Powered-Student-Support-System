import { GeminiProvider } from './geminiProvider';
import { BedrockProvider } from './bedrockProvider';
import { AIProvider, AIResponse } from './aiProvider';
import { VectorChunk } from '../../types';
import { config } from '../../config/environment';

class AIService {
  private provider: AIProvider;

  constructor() {
    if (config.APP_MODE === 'aws') {
      this.provider = new BedrockProvider();
    } else {
      this.provider = new GeminiProvider();
    }
  }

  public setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  public async generateAnswer(prompt: string, contextChunks: VectorChunk[]): Promise<AIResponse> {
    return this.provider.generateAnswer(prompt, contextChunks);
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }
}

export const aiService = new AIService();
