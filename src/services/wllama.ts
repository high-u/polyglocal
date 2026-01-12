import { Wllama, type WllamaChatMessage } from '@wllama/wllama';

export type DeleteResult =
  | { type: 'success' }
  | { type: 'error' }
  | { type: 'not_found' };

const createWllama = () =>
  new Wllama({
    'single-thread/wllama.wasm': '/wllama/wllama-single.wasm',
    'multi-thread/wllama.wasm': '/wllama/wllama.wasm',
  });

/**
 * OPFS内のキャッシュディレクトリを走査し、
 * 有効なモデル（メタデータと本体が存在するもの）のURLリストを返します。
 */
const listCachedModels = async (): Promise<string[]> => {
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
};

/**
 * 指定されたモデル（URLまたはファイル名）が、
 * リストに含まれているかを判定します。
 */
const isModelCached = async (modelUrl: string): Promise<boolean> => {
  const cachedUrls = await listCachedModels();
  return cachedUrls.includes(modelUrl);
};

const getCurrentContextSize = (ctxSize: number = 4096): number => {
  return ctxSize;
};

const tokenize = async (wllama: Wllama, text: string): Promise<number[]> => {
  if (!wllama.isModelLoaded()) {
    throw new Error('Model not loaded');
  }
  return await wllama.tokenize(text);
};

const downloadModel = async (
  modelUrl: string,
  onProgress: (p: number) => void,
): Promise<void> => {
  const wllama = createWllama();
  if (wllama.isModelLoaded()) return;

  try {
    await wllama.loadModelFromUrl(modelUrl, {
      progressCallback: ({ loaded, total }) => {
        const p = (loaded / total) * 100;
        onProgress(p);
      },
    });
    await wllama.exit();
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const deleteModelByUrl = async (modelUrl: string): Promise<DeleteResult> => {
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
};

const deleteCache = async (modelUrl: string): Promise<DeleteResult> => {
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
};

const clearAllCaches = async (): Promise<void> => {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry('cache', { recursive: true });
  } catch (e) {
    console.warn('Could not clear all caches', e);
  }
};

const translate = async (
  text: string,
  targetLanguage: string,
  onNewToken?: (text: string) => void,
): Promise<string> => {
  const systemPrompt = `You are a professional translator. Translate the following text into ${targetLanguage}.`;

  const messages: WllamaChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text },
  ];

  const wllama = createWllama();
  try {
    const res = await wllama.createChatCompletion(messages, {
      nPredict: 512,
      sampling: {
        temp: 0.1,
      },
      onNewToken: (_token, _piece, currentText) => {
        if (onNewToken) onNewToken(currentText);
      },
    });

    return res;
  } finally {
    await wllama.exit();
  }
};

const completion = async (
  systemPrompt: string,
  userPrompt: string,
  modelUrl: string,
  contextLength: number,
  configJson: string,
  onNewToken?: (currentText: string) => void,
): Promise<string> => {
  let samplingConfig = {};

  try {
    if (configJson) {
      samplingConfig = JSON.parse(configJson);
    }
  } catch (e) {
    console.warn('Config Parse Error', e);
  }

  const wllama = createWllama();
  try {
    await wllama.loadModelFromUrl(modelUrl, {
      n_ctx: contextLength,
    });

    const messages: WllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const res = await wllama.createChatCompletion(messages, {
      nPredict: contextLength,
      sampling: samplingConfig,
      onNewToken: (_token, _piece, currentText) => {
        if (onNewToken) onNewToken(currentText);
      },
    });

    return res;
  } finally {
    await wllama.exit();
  }
};

export {
  listCachedModels,
  isModelCached,
  getCurrentContextSize,
  tokenize,
  downloadModel,
  deleteModelByUrl,
  deleteCache,
  clearAllCaches,
  translate,
  completion,
};
