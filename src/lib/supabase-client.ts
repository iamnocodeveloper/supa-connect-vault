import { storage, ConnectionData } from './storage';
import { parseSupabaseSchema, getTableColumns } from './supabase-helpers';
import { supabase } from '@/integrations/supabase/client';


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
      const { data, error } = await supabase.functions.invoke('resolve-project', {
        body: { token, action: 'list' }
      });
      if (error) throw new Error(error.message || 'Failed to fetch projects');
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch projects');
      const projects = Array.isArray(data.projects) ? data.projects : [];
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
      if (!projectRef) throw new Error('Could not find project reference');

      const { data, error } = await supabase.functions.invoke('resolve-project', {
        body: { token, action: 'keys', ref: projectRef }
      });
      if (error) throw new Error(error.message || 'Failed to fetch API keys');
      if (!data?.success || !data?.project?.anonKey) throw new Error(data?.error || 'Could not retrieve anon key');

      const projectUrl = `https://${projectRef}.supabase.co`;
      this.url = projectUrl;
      this.token = data.project.anonKey;
      await storage.setConnection({ url: projectUrl, token: this.token });
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
      return projectsResult as any;
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