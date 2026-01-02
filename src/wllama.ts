import { Wllama, type WllamaChatMessage } from '@wllama/wllama';

const MODEL_URL =
  'https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF/resolve/main/HY-MT1.5-1.8B-Q4_K_M.gguf';

export class WllamaService {
  wllama: Wllama;
  modelPath: string;

  constructor() {
    this.wllama = new Wllama({
      'single-thread/wllama.wasm': '/wllama/wllama-single.wasm',
      'multi-thread/wllama.wasm': '/wllama/wllama.wasm',
    });
    this.modelPath = MODEL_URL;
  }

  currentCtxSize: number = 4096;

  async checkCacheResult(): Promise<boolean> {
    return localStorage.getItem('model_downloaded') === 'true';
  }

  getCurrentContextSize(): number {
    return this.currentCtxSize;
  }

  async loadModel(
    onProgress?: (progress: number) => void,
    config: { n_ctx: number } = { n_ctx: 4096 },
  ) {
    if (this.wllama.isModelLoaded()) return;

    this.currentCtxSize = config.n_ctx;

    await this.wllama.loadModelFromUrl(MODEL_URL, {
      n_ctx: config.n_ctx,
      progressCallback: ({ loaded, total }) => {
        const p = (loaded / total) * 100;
        if (onProgress) onProgress(p);
      },
    });
  }

  async reloadModel(n_ctx: number) {
    await this.wllama.exit();
    await this.loadModel(undefined, { n_ctx });
  }

  async tokenize(text: string): Promise<number[]> {
    if (!this.wllama.isModelLoaded()) {
      throw new Error('Model not loaded');
    }
    return await this.wllama.tokenize(text);
  }

  async downloadModel(onProgress: (p: number) => void): Promise<void> {
    if (this.wllama.isModelLoaded()) {
      localStorage.setItem('model_downloaded', 'true');
      return;
    }
    try {
      await this.wllama.loadModelFromUrl(MODEL_URL, {
        progressCallback: ({ loaded, total }) => {
          const p = (loaded / total) * 100;
          onProgress(p);
        },
      });
      localStorage.setItem('model_downloaded', 'true');
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async deleteCache(): Promise<void> {
    localStorage.removeItem('model_downloaded');
    try {
      await caches.delete('wllama_cache');
    } catch (e) {
      console.warn('Could not delete cache', e);
    }
  }

  async translate(
    text: string,
    targetLanguage: string,
    onNewToken?: (text: string) => void,
  ): Promise<string> {
    const systemPrompt = `You are a professional translator. Translate the following text into ${targetLanguage}.`;

    const messages: WllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ];

    const res = await this.wllama.createChatCompletion(messages, {
      nPredict: 512,
      sampling: {
        temp: 0.1,
      },
      onNewToken: (_token, _piece, currentText) => {
        if (onNewToken) onNewToken(currentText);
      },
    });

    return res;
  }
}
