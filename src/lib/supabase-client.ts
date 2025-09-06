import { storage, ConnectionData } from './storage';

export class SupabaseClient {
  private url: string = '';
  private token: string = '';

  async initialize() {
    const connection = await storage.getConnection();
    if (connection) {
      this.url = connection.url;
      this.token = connection.token;
      return true;
    }
    return false;
  }

  async connect(url: string, token: string) {
    // Clean URL - remove trailing slash and ensure https
    const cleanUrl = url.replace(/\/$/, '').replace(/^http:/, 'https:');
    
    try {
      // Test connection
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          'apikey': token,
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
      }

      this.url = cleanUrl;
      this.token = token;

      // Store credentials
      await storage.setConnection({ url: cleanUrl, token });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  async disconnect() {
    await storage.clearConnection();
    this.url = '';
    this.token = '';
  }

  isConnected() {
    return !!this.url && !!this.token;
  }

  private getHeaders() {
    return {
      'apikey': this.token,
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getTables() {
    if (!this.isConnected()) throw new Error('Not connected');

    try {
      const response = await fetch(`${this.url}/rest/v1/`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.status}`);
      }

      // Get schema information
      const schemaResponse = await fetch(`${this.url}/rest/v1/?select=*`, {
        headers: this.getHeaders()
      });

      // For now, return some mock tables - in real implementation, 
      // you'd parse the OpenAPI schema from the response
      return [
        { name: 'users', schema: 'public' },
        { name: 'posts', schema: 'public' },
        { name: 'profiles', schema: 'public' }
      ];
    } catch (error) {
      throw new Error(`Failed to fetch tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTableData(tableName: string, page = 0, limit = 20) {
    if (!this.isConnected()) throw new Error('Not connected');

    try {
      const offset = page * limit;
      const response = await fetch(
        `${this.url}/rest/v1/${tableName}?limit=${limit}&offset=${offset}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch table data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeQuery(query: string) {
    if (!this.isConnected()) throw new Error('Not connected');

    try {
      // For SQL queries, we'd use the PostgREST RPC endpoint
      // This is a simplified implementation
      const response = await fetch(`${this.url}/rpc/execute_sql`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectStats() {
    if (!this.isConnected()) throw new Error('Not connected');

    // Mock data for demonstration - in real implementation,
    // you'd fetch actual metrics from Supabase
    return {
      restRequests: 1539,
      authRequests: 44,
      storageRequests: 647,
      realtimeRequests: 0,
      totalUsers: 1752,
      activeUsers: 234,
      dataSize: '2.4 GB',
      bandwidth: '156 MB'
    };
  }
}

export const supabaseClient = new SupabaseClient();