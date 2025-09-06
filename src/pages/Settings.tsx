import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, LogOut, Trash2, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { supabaseClient } from '@/lib/supabase-client';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [connectionData, setConnectionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadConnectionData = async () => {
      try {
        const connection = await storage.getConnection();
        setConnectionData(connection);
      } catch (error) {
        console.error('Failed to load connection data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnectionData();
  }, []);

  const handleDisconnect = async () => {
    try {
      await supabaseClient.disconnect();
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Supabase project",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive"
      });
    }
  };

  const clearQueryHistory = async () => {
    try {
      await storage.setQueryHistory([]);
      toast({
        title: "History cleared",
        description: "Query history has been cleared",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm">Manage your app preferences</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Connection Status */}
          <Card className="glass-card p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">Connection Status</span>
              </div>
              
              {connectionData ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm text-primary font-medium">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Project URL</span>
                    <span className="text-sm font-mono truncate max-w-40">
                      {connectionData.url.replace('https://', '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Connected</span>
                    <span className="text-sm">
                      {connectionData.lastConnected 
                        ? new Date(connectionData.lastConnected).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Not connected to any project</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/')}
                    className="mt-2"
                  >
                    Connect Now
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Security Information */}
          <Card className="glass-card p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="font-medium">Security & Privacy</span>
              </div>
              
              <Alert className="border-primary/20">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your API tokens are stored securely on your device only. 
                  We never transmit or store your credentials on our servers.
                </AlertDescription>
              </Alert>
            </div>
          </Card>

          {/* Actions */}
          <Card className="glass-card p-4">
            <div className="space-y-3">
              <h3 className="font-medium">Actions</h3>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={clearQueryHistory}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Query History
                </Button>

                {connectionData && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDisconnect}
                    className="w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Project
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* App Information */}
          <Card className="glass-card p-4">
            <div className="space-y-3">
              <h3 className="font-medium">About SupaConnect</h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Version 1.0.0</p>
                <p>A secure mobile client for Supabase project management</p>
                <p className="text-xs">Built with React, TypeScript, and Tailwind CSS</p>
              </div>
              
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-primary"
                onClick={() => window.open('https://supabase.com/docs', '_blank')}
              >
                Supabase Documentation →
              </Button>
            </div>
          </Card>

          {/* Install PWA prompt */}
          <Card className="glass-card p-4">
            <div className="space-y-3">
              <h3 className="font-medium">Install App</h3>
              <p className="text-sm text-muted-foreground">
                Add SupaConnect to your home screen for quick access
              </p>
              <Button variant="outline" size="sm">
                Install App
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}