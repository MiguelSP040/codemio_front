export class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] ?? null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

export function setupLocalStorageMock() {
  globalThis.localStorage = new LocalStorageMock();
}

export function setCurrentSession(accessToken) {
  localStorage.setItem('codemio_auth', JSON.stringify({ accessToken }));
}

export function setLegacySession(token) {
  localStorage.setItem('auth', JSON.stringify({ token }));
}
