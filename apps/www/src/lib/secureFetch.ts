// Stub for SecureFetch class
export class SecureFetch {
  constructor(user?: any) {
    // User passed for authentication
  }

  async fetch(url: string, options?: RequestInit) {
    return fetch(url, options);
  }
}
