import { storage, ConnectionData } from './storage';
import { parseSupabaseSchema, getTableColumns } from './supabase-helpers';

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
    // For experimental tokens, we don't need a URL - the token contains project info
    if (!token) {
      return { 
        success: false, 
        error: 'Token is required' 
      };
    }

    try {
      // For experimental tokens, we test connection differently
      // We'll use the Supabase management API endpoint
      const testUrl = url || 'https://api.supabase.com';
      const response = await fetch(`${testUrl}/v1/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
      }

      this.url = url || '';
      this.token = token;

      // Store credentials
      await storage.setConnection({ url: this.url, token });
      
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
      // Get OpenAPI schema which contains table information
      const response = await fetch(`${this.url}/rest/v1/`, {
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status}`);
      }

      const schema = await response.json();
      return parseSupabaseSchema(schema);
    } catch (error) {
      throw new Error(`Failed to fetch tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTableColumns(tableName: string) {
    if (!this.isConnected()) throw new Error('Not connected');

    try {
      const response = await fetch(`${this.url}/rest/v1/`, {
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status}`);
      }

      const schema = await response.json();
      return getTableColumns(schema, tableName);
    } catch (error) {
      throw new Error(`Failed to fetch table columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Note: Direct SQL execution requires service_role key or custom RPC function
    // For security, most Supabase projects don't allow arbitrary SQL execution with anon key
    throw new Error('Direct SQL execution requires service_role key. Please use specific API endpoints for data access.');
  }

  async getProjectStats() {
    if (!this.isConnected()) throw new Error('Not connected');

    try {
      // Get basic project information
      const tables = await this.getTables();
      
      // Get auth users count if auth table is accessible
      let totalUsers = 0;
      try {
        const usersResponse = await fetch(`${this.url}/auth/v1/admin/users`, {
          headers: this.getHeaders()
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          totalUsers = usersData.users ? usersData.users.length : 0;
        }
      } catch {
        // Auth endpoint might not be accessible with current token
      }

      return {
        restRequests: 'N/A',
        authRequests: 'N/A', 
        storageRequests: 'N/A',
        realtimeRequests: 'N/A',
        totalUsers: totalUsers,
        activeUsers: 'N/A',
        dataSize: `${tables.length} tables`,
        bandwidth: 'N/A'
      };
    } catch (error) {
      throw new Error(`Failed to fetch project stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const supabaseClient = new SupabaseClient();