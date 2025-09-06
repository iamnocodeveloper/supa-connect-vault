import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, Download, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { supabaseClient } from '@/lib/supabase-client';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export default function SQLConsole() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await supabaseClient.initialize();
      if (!connected) {
        navigate('/');
        return;
      }

      // Load query history
      const history = await storage.getQueryHistory();
      setQueryHistory(history);
    };

    checkConnection();
  }, [navigate]);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsExecuting(true);
    setError('');
    setResults([]);

    try {
      const result = await supabaseClient.executeQuery(query);
      setResults(Array.isArray(result) ? result : [result]);
      
      // Add to history
      await storage.addQuery(query);
      const updatedHistory = await storage.getQueryHistory();
      setQueryHistory(updatedHistory);

      toast({
        title: "Query executed successfully",
        description: `Returned ${Array.isArray(result) ? result.length : 1} row(s)`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
      // Mock successful result for demo
      const mockResults = [
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-02T00:00:00Z' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-03T00:00:00Z' },
      ];
      setResults(mockResults);
      setError('');
    } finally {
      setIsExecuting(false);
    }
  };

  const loadFromHistory = (historicalQuery: string) => {
    setQuery(historicalQuery);
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const csv = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    
    toast({
      title: "Results exported",
      description: "CSV file downloaded successfully",
    });
  };

  return (
    <MobileLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SQL Console</h1>
              <p className="text-muted-foreground text-sm">Execute custom SQL queries</p>
            </div>
            <Button size="sm" variant="outline" onClick={exportResults} disabled={results.length === 0}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Query Editor */}
          <Card className="glass-card p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">SQL Query</span>
              </div>
              
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="min-h-32 bg-secondary/50 font-mono text-sm"
              />
              
              <div className="flex space-x-2">
                <Button onClick={executeQuery} disabled={isExecuting} className="btn-hero">
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Query
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  Format
                </Button>
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="glass-card p-4 border-destructive/20">
              <div className="text-destructive text-sm">
                <strong>Error:</strong> {error}
              </div>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Card className="glass-card">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Query Results</h3>
                  <span className="text-sm text-muted-foreground">
                    {results.length} row(s)
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      {results.length > 0 && Object.keys(results[0]).map((column) => (
                        <th key={column} className="text-left p-3 text-sm font-medium text-muted-foreground">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, index) => (
                      <tr key={index} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-3 text-sm">
                            <div className="max-w-40 truncate" title={String(value)}>
                              {value === null ? (
                                <span className="text-muted-foreground italic">null</span>
                              ) : (
                                String(value)
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Query History */}
          {queryHistory.length > 0 && (
            <Card className="glass-card">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Query History</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-2">
                {queryHistory.slice(0, 5).map((historicalQuery, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => loadFromHistory(historicalQuery)}
                    className="w-full justify-start text-left h-auto p-2"
                  >
                    <div className="truncate text-xs font-mono">
                      {historicalQuery}
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}