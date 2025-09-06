import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Filter, RefreshCw, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { EmptyState } from '@/components/EmptyState';
import { supabaseClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

export default function DataBrowser() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await supabaseClient.initialize();
      if (!connected) {
        navigate('/');
        return;
      }

      try {
        const tableList = await supabaseClient.getTables();
        setTables(tableList);
        if (tableList.length > 0) {
          setSelectedTable(tableList[0].name);
        } else {
          toast({
            title: "No tables found",
            description: "Your Supabase project doesn't have any tables yet. Create some tables first.",
            variant: "default"
          });
        }
      } catch (error) {
        toast({
          title: "Error loading tables",
          description: "Failed to fetch table list. Check your API key permissions.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [navigate, toast]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, currentPage]);

  const loadTableData = async () => {
    if (!selectedTable) return;

    setIsLoadingData(true);
    try {
      const data = await supabaseClient.getTableData(selectedTable, currentPage, 20);
      setTableData(data);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: `Failed to fetch data from ${selectedTable}`,
        variant: "destructive"
      });
      // Fallback to mock data
      setTableData([
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-01' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-02' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-03' },
      ]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const refreshData = () => {
    loadTableData();
    toast({
      title: "Data refreshed",
      description: `Reloaded data from ${selectedTable}`,
    });
  };

  const filteredData = tableData.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tables...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Show empty state if no tables
  if (tables.length === 0) {
    return (
      <MobileLayout>
        <div className="min-h-screen p-6 flex items-center justify-center">
          <EmptyState
            icon={<Table className="w-8 h-8 text-muted-foreground" />}
            title="No tables found"
            description="Your Supabase project doesn't have any tables yet. Create some tables in your Supabase dashboard to get started."
            actionLabel="Open Supabase Dashboard"
            onAction={() => window.open('https://supabase.com/dashboard', '_blank')}
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Data Browser</h1>
              <p className="text-muted-foreground text-sm">Explore your database tables</p>
            </div>
            <Button size="sm" variant="outline" onClick={refreshData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Table Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="bg-secondary/50">
                  <Table className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name} ({table.columns || 0} columns)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="px-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      {filteredData.length > 0 && Object.keys(filteredData[0]).map((column) => (
                        <th key={column} className="text-left p-3 text-sm font-medium text-muted-foreground">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, index) => (
                      <tr key={index} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-3 text-sm">
                            <div className="max-w-32 truncate" title={String(value)}>
                              {String(value)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-8">
                  <Table className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data found</p>
                </div>
              )}
            </Card>
          )}

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between mt-4 pb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredData.length} of {tableData.length} rows
              </p>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}