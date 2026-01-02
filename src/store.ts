export interface State {
  isModelCached: boolean;
  isModelLoaded: boolean;
  isTranslating: boolean;
  downloadProgress: number;
  errorMessage: string | null;
  warningMessage: string | null;
}

export class Store {
  state: State;

  constructor() {
    this.state = {
      isModelCached: false,
      isModelLoaded: false,
      isTranslating: false,
      downloadProgress: 0,
      errorMessage: null,
      warningMessage: null,
    };
  }

  setModelCached(cached: boolean) {
    this.state.isModelCached = cached;
  }

  setModelLoaded(loaded: boolean) {
    this.state.isModelLoaded = loaded;
  }

  setTranslating(translating: boolean) {
    this.state.isTranslating = translating;
  }

  setDownloadProgress(progress: number) {
    this.state.downloadProgress = progress;
  }

  setError(error: string | null) {
    this.state.errorMessage = error;
  }

  setWarning(warning: string | null) {
    this.state.warningMessage = warning;
  }
}
