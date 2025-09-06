// Helper functions for Supabase data fetching
export interface TableInfo {
  name: string;
  schema: string;
  columns?: number;
}

export interface ProjectStats {
  restRequests: string | number;
  authRequests: string | number;
  storageRequests: string | number;
  realtimeRequests: string | number;
  totalUsers: number;
  activeUsers: string | number;
  dataSize: string;
  bandwidth: string;
}

export const parseSupabaseSchema = (openApiSchema: any): TableInfo[] => {
  const tables: TableInfo[] = [];
  
  if (!openApiSchema.definitions) {
    return tables;
  }

  for (const [tableName, definition] of Object.entries(openApiSchema.definitions)) {
    if (typeof definition === 'object' && definition !== null && 'type' in definition) {
      const def = definition as any;
      tables.push({
        name: tableName,
        schema: 'public',
        columns: def.properties ? Object.keys(def.properties).length : 0
      });
    }
  }

  return tables.sort((a, b) => a.name.localeCompare(b.name));
};

export const getTableColumns = (openApiSchema: any, tableName: string) => {
  if (!openApiSchema.definitions || !openApiSchema.definitions[tableName]) {
    return [];
  }

  const definition = openApiSchema.definitions[tableName];
  if (!definition.properties) {
    return [];
  }

  return Object.entries(definition.properties).map(([columnName, columnDef]: [string, any]) => ({
    name: columnName,
    type: columnDef.type || 'unknown',
    format: columnDef.format,
    nullable: !definition.required?.includes(columnName)
  }));
};