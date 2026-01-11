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
    config: { contextLength: number } = { contextLength: 4096 },
  ) {
    if (this.wllama.isModelLoaded()) return;

    this.currentCtxSize = config.contextLength;

    await this.wllama.loadModelFromUrl(modelUrl, {
      n_ctx: config.contextLength,
      progressCallback: ({ loaded, total }) => {
        const p = (loaded / total) * 100;
        if (onProgress) onProgress(p);
      },
    });
  }

  async reloadModel(modelUrl: string, contextLength: number) {
    await this.wllama.exit();
    await this.loadModel(modelUrl, undefined, { contextLength });
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

  async deleteModelByUrl(modelUrl: string): Promise<DeleteResult> {
    try {
      const root = await navigator.storage.getDirectory();
      const cacheDir = await root.getDirectoryHandle('cache');

      // @ts-expect-error: values() iterator might be missing in types
      for await (const name of cacheDir.keys()) {
        if (name.startsWith('__metadata__')) {
          try {
            const fileHandle = await cacheDir.getFileHandle(name);
            const file = await fileHandle.getFile();
            const text = await file.text();
            const metadata = JSON.parse(text);

            if (metadata.originalURL === modelUrl) {
              // Found match, delete metadata and main file
              await cacheDir.removeEntry(name);

              const mainFile = name.replace('__metadata__', '');
              // Try to delete main file if exists (it might not if corrupted, but we try)
              try {
                await cacheDir.removeEntry(mainFile);
              } catch (_e) {
                console.warn(
                  'Could not delete main file (might be missing):',
                  mainFile,
                );
              }

              return { type: 'success' };
            }
          } catch (e) {
            console.warn(
              'Error processing metadata file during delete:',
              name,
              e,
            );
          }
        }
      }
      return { type: 'not_found' };
    } catch (e) {
      console.error('Delete by URL failed:', e);
      return { type: 'error' };
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

  async completion(
    systemPrompt: string,
    userPrompt: string,
    modelUrl: string,
    contextLength: number,
    configJson: string,
    onNewToken?: (currentText: string) => void,
  ): Promise<string> {
    let samplingConfig = {};

    try {
      if (configJson) {
        samplingConfig = JSON.parse(configJson);
      }
    } catch (e) {
      console.warn('Config Parse Error', e);
    }

    try {
      if (this.wllama.isModelLoaded()) {
        await this.unloadModel();
      }

      await this.loadModel(modelUrl, undefined, { contextLength });

      const messages: WllamaChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const res = await this.wllama.createChatCompletion(messages, {
        nPredict: contextLength,
        sampling: samplingConfig,
        onNewToken: (_token, _piece, currentText) => {
          if (onNewToken) onNewToken(currentText);
        },
      });

      return res;
    } finally {
      await this.unloadModel();
    }
  }
}
