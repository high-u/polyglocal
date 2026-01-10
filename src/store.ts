export type AppStatus =
  | 'INITIAL' // Not cached, showing download UI
  | 'DOWNLOADING' // Downloading model
  | 'READY' // Cached, showing Ready message
  | 'SETTINGS' // Cached, showing Settings UI
  | 'TRANSLATING'; // Translating

export interface State {
  status: AppStatus;
  downloadProgress: number;
  errorMessage: string | null;
  isInitialized: boolean;
}

export class Store {
  state: State;

  constructor() {
    this.state = {
      status: 'INITIAL',
      downloadProgress: 0,
      errorMessage: null,
      isInitialized: false,
    };
  }

  setStatus(status: AppStatus) {
    this.state.status = status;
  }

  setDownloadProgress(progress: number) {
    this.state.downloadProgress = progress;
  }

  setError(error: string | null) {
    this.state.errorMessage = error;
  }

  setInitialized(initialized: boolean) {
    this.state.isInitialized = initialized;
  }
}
