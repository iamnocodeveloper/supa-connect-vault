import localForage from 'localforage';

// Configure local storage for secure token management
localForage.config({
  name: 'SupaConnect',
  storeName: 'credentials',
  description: 'Secure local storage for Supabase credentials'
});

export interface ConnectionData {
  url: string;
  token: string;
  projectName?: string;
  lastConnected?: string;
}

export const storage = {
  // Store connection data securely
  async setConnection(data: ConnectionData) {
    await localForage.setItem('connection', {
      ...data,
      lastConnected: new Date().toISOString()
    });
  },

  // Retrieve connection data
  async getConnection(): Promise<ConnectionData | null> {
    return await localForage.getItem('connection');
  },

  // Clear all stored credentials
  async clearConnection() {
    await localForage.removeItem('connection');
  },

  // Store query history
  async setQueryHistory(queries: string[]) {
    await localForage.setItem('queryHistory', queries);
  },

  // Get query history
  async getQueryHistory(): Promise<string[]> {
    return (await localForage.getItem('queryHistory')) || [];
  },

  // Add query to history
  async addQuery(query: string) {
    const history = await this.getQueryHistory();
    const updatedHistory = [query, ...history.filter(q => q !== query)].slice(0, 20);
    await this.setQueryHistory(updatedHistory);
  }
};