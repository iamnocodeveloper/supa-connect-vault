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

  async fetchProjects(token: string) {
    try {
      // Call Supabase Management API directly
      const response = await fetch('https://api.supabase.com/v1/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const projects = await response.json();
      
      if (!Array.isArray(projects)) {
        throw new Error('Invalid response format');
      }

      return { success: true, projects };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch projects' 
      };
    }
  }

  async connectToProject(token: string, project: any) {
    try {
      const projectRef = project?.ref || project?.project_ref;
      
      if (!projectRef) {
        throw new Error('Could not find project reference');
      }

      // Call Supabase Management API directly for API keys
      const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!keysResponse.ok) {
        throw new Error(`Failed to fetch API keys: ${keysResponse.status} ${keysResponse.statusText}`);
      }

      const keysData = await keysResponse.json();
      let anonKey = null;

      // Extract anon key from the response
      if (Array.isArray(keysData)) {
        const anonKeyObj = keysData.find((k: any) => (k?.name || '').toLowerCase() === 'anon');
        anonKey = anonKeyObj?.api_key;
      } else if (keysData?.anon) {
        anonKey = keysData.anon;
      }

      if (!anonKey) {
        throw new Error('Could not retrieve anon key for project');
      }

      // Set up the connection with the project URL and anon key
      const projectUrl = `https://${projectRef}.supabase.co`;
      this.url = projectUrl;
      this.token = anonKey;

      // Store credentials
      await storage.setConnection({ url: projectUrl, token: anonKey });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  async connect(url: string, token: string) {
    // Legacy method - auto-select first project
    const projectsResult = await this.fetchProjects(token);
    if (!projectsResult.success || !projectsResult.projects?.length) {
      return projectsResult;
    }

    const firstProject = projectsResult.projects[0];
    return this.connectToProject(token, firstProject);
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