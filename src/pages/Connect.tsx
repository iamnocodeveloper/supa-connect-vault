import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase-client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useToast } from '@/hooks/use-toast';

export default function Connect() {
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFetchProjects = async () => {
    if (!token) {
      setError('Please enter your experimental token');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const result = await supabaseClient.fetchProjects(token);
      
      if (result.success && result.projects) {
        setProjects(result.projects);
        setShowProjectSelection(true);
        toast({
          title: "Projects loaded!",
          description: `Found ${result.projects.length} project(s) in your account.`,
        });
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectToProject = async (project: any) => {
    setIsConnecting(true);
    setError('');
    setSelectedProject(project);

    try {
      const result = await supabaseClient.connectToProject(token, project);
      
      if (result.success) {
        setIsConnected(true);
        toast({
          title: "Connected successfully!",
          description: `Connected to ${project.name}.`,
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClearCredentials = async () => {
    await supabaseClient.disconnect();
    setToken('');
    setProjects([]);
    setSelectedProject(null);
    setShowProjectSelection(false);
    setIsConnected(false);
    setError('');
    toast({
      title: "Credentials cleared",
      description: "All stored credentials have been removed.",
    });
  };

  return (
    <MobileLayout showNavigation={false}>
      <div className="min-h-screen p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto glass-card rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to SupaConnect</h1>
            <p className="text-muted-foreground">
              Connect your Supabase project to get started
            </p>
          </div>

          {/* Connection Form */}
          <Card className="glass-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Experimental Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Your experimental token (sbp_...)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isConnected && (
              <Alert className="border-primary/20 text-primary">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Connection successful! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            {!showProjectSelection ? (
              <Button 
                onClick={handleFetchProjects}
                disabled={isConnecting || isConnected || !token}
                className="w-full btn-hero"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Projects...
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Connected
                  </>
                ) : (
                  'Load Projects'
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Select a Project:</h3>
                {projects.map((project) => (
                  <Card 
                    key={project.ref} 
                    className={`p-3 cursor-pointer transition-colors hover:bg-secondary/50 ${
                      selectedProject?.ref === project.ref ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleConnectToProject(project)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {project.status} • {project.ref}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {selectedProject?.ref === project.ref && isConnecting && (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        )}
                        {isConnected && selectedProject?.ref === project.ref && (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowProjectSelection(false);
                    setProjects([]);
                    setSelectedProject(null);
                  }}
                  className="w-full"
                >
                  ← Back to Token Input
                </Button>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={handleClearCredentials}
              className="w-full"
            >
              Clear Stored Credentials
            </Button>
          </Card>

          {/* Security Notice */}
          <Card className="glass-card p-4">
            <div className="flex items-start space-x-3">
              <div className="text-primary mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Security Notice</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your API token is stored securely on your device only. 
                  We never store or transmit your credentials to our servers.
                </p>
              </div>
            </div>
          </Card>

          {/* Help Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Need help?</p>
            <Button 
              variant="link" 
              className="text-primary text-sm"
              onClick={() => window.open('https://supabase.com/dashboard/account/tokens', '_blank')}
            >
              Create your Experimental Token →
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}