import { Wllama, type WllamaChatMessage } from '@wllama/wllama';

export type DeleteResult =
  | { type: 'success' }
  | { type: 'error' }
  | { type: 'not_found' };

export class WllamaService {
  wllama: Wllama;

  constructor() {
    this.wllama = new Wllama({
      'single-thread/wllama.wasm': '/wllama/wllama-single.wasm',
      'multi-thread/wllama.wasm': '/wllama/wllama.wasm',
    });
  }

  currentCtxSize: number = 4096;

  /**
   * OPFS内のキャッシュディレクトリを走査し、
   * 有効なモデル（メタデータと本体が存在するもの）のURLリストを返します。
   */
  async listCachedModels(): Promise<string[]> {
    try {
      const root = await navigator.storage.getDirectory();
      const cacheDir = await root.getDirectoryHandle('cache').catch(() => null);
      if (!cacheDir) return [];

      const urls: string[] = [];
      const keys: string[] = [];
      // @ts-expect-error: values() iterator might be missing in types
      for await (const name of cacheDir.keys()) {
        keys.push(name);
      }

      for (const name of keys) {
        if (name.startsWith('__metadata__')) {
          const mainFileName = name.replace('__metadata__', '');
          if (keys.includes(mainFileName)) {
            try {
              const fileHandle = await cacheDir.getFileHandle(name);
              const file = await fileHandle.getFile();
              const text = await file.text();
              const metadata = JSON.parse(text);
              if (metadata.originalURL) {
                urls.push(metadata.originalURL);
              }
            } catch (e) {
              console.warn('Failed to parse metadata for:', name, e);
            }
          }
        }
      }
      return urls;
    } catch (e) {
      console.warn('Failed to list cached models:', e);
      return [];
    }
  }

  /**
   * 指定されたモデル（URLまたはファイル名）が、
   * リストに含まれているかを判定します。
   */
  async isModelCached(modelUrl: string): Promise<boolean> {
    const cachedUrls = await this.listCachedModels();
    return cachedUrls.includes(modelUrl);
  }

  getCurrentContextSize(): number {
    return this.currentCtxSize;
  }

  async loadModel(
    modelUrl: string,
    onProgress?: (progress: number) => void,
    config: { n_ctx: number } = { n_ctx: 4096 },
  ) {
    if (this.wllama.isModelLoaded()) return;

    this.currentCtxSize = config.n_ctx;

    await this.wllama.loadModelFromUrl(modelUrl, {
      n_ctx: config.n_ctx,
      progressCallback: ({ loaded, total }) => {
        const p = (loaded / total) * 100;
        if (onProgress) onProgress(p);
      },
    });
  }

  async reloadModel(modelUrl: string, n_ctx: number) {
    await this.wllama.exit();
    await this.loadModel(modelUrl, undefined, { n_ctx });
  }

  async unloadModel() {
    await this.wllama.exit();
  }

  async tokenize(text: string): Promise<number[]> {
    if (!this.wllama.isModelLoaded()) {
      throw new Error('Model not loaded');
    }
    return await this.wllama.tokenize(text);
  }

  async downloadModel(
    modelUrl: string,
    onProgress: (p: number) => void,
  ): Promise<void> {
    if (this.wllama.isModelLoaded()) return;

    try {
      await this.wllama.loadModelFromUrl(modelUrl, {
        progressCallback: ({ loaded, total }) => {
          const p = (loaded / total) * 100;
          onProgress(p);
        },
      });
      await this.wllama.exit();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async deleteCache(modelUrl: string): Promise<DeleteResult> {
    const filename = modelUrl.split('/').pop();
    if (!filename) return { type: 'error' };

    try {
      const root = await navigator.storage.getDirectory();
      const cacheDir = await root.getDirectoryHandle('cache');

      let deletedCount = 0;
      // @ts-expect-error: values() iterator might be missing in types
      for await (const name of cacheDir.keys()) {
        if (name.includes(filename)) {
          await cacheDir.removeEntry(name);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        return { type: 'success' };
      } else {
        return { type: 'not_found' };
      }
    } catch (e) {
      console.warn('Could not delete from OPFS', e);
      return { type: 'error' };
    }
  }

  async clearAllCaches(): Promise<void> {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry('cache', { recursive: true });
    } catch (e) {
      console.warn('Could not clear all caches', e);
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
