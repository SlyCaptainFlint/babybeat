class ErrorService {
  private static instance: ErrorService;
  private lastError: Error | null = null;
  private listeners: Array<(error: Error | null) => void> = [];

  private constructor() {}

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  setError(error: Error) {
    this.lastError = error;
    this.notifyListeners(error);
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  clearError() {
    this.lastError = null;
    this.notifyListeners(null);
  }

  addListener(listener: (error: Error | null) => void) {
    this.listeners.push(listener);
    listener(this.lastError);
  }

  removeListener(listener: (error: Error | null) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(error: Error | null) {
    this.listeners.forEach(listener => listener(error));
  }
}

export const errorService = ErrorService.getInstance(); 