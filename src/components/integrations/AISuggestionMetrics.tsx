
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuggestionType } from "@/hooks/useAICampaignAssistant";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AISuggestionMetricsProps {
  projectId?: string;
}

export function AISuggestionMetrics({ projectId }: AISuggestionMetricsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestionData, setSuggestionData] = useState<any[]>([]);
  const [metricsTab, setMetricsTab] = useState<string>("usage");
  const { projectId: routeProjectId } = useParams();
  const { toast } = useToast();
  const effectiveProjectId = projectId || routeProjectId;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Fetch AI suggestion metrics data
  useEffect(() => {
    const fetchSuggestionMetrics = async () => {
      if (!effectiveProjectId) return;
      
      setIsLoading(true);
      try {
        // Get suggestion usage data
        const { data, error } = await supabase
          .from('ai_suggestion_feedback')
          .select('*')
          .eq('project_id', effectiveProjectId);
          
        if (error) throw error;
        
        setSuggestionData(data || []);
      } catch (error) {
        console.error('Error fetching suggestion metrics:', error);
        toast({
          title: "Failed to load metrics",
          description: "Could not retrieve AI suggestion usage data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestionMetrics();
  }, [effectiveProjectId]);

  // Process data for charts
  const getUsageByType = () => {
    const typeCounts: Record<string, number> = {};
    suggestionData.forEach(item => {
      const type = item.suggestion_type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };
  
  const getActionDistribution = () => {
    const actionCounts: Record<string, number> = {};
    suggestionData.forEach(item => {
      const action = item.action;
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    
    return Object.entries(actionCounts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  };
  
  const getConfidenceLevels = () => {
    const confidenceCounts: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    suggestionData.forEach(item => {
      if (item.suggestion_confidence) {
        confidenceCounts[item.suggestion_confidence] = 
          (confidenceCounts[item.suggestion_confidence] || 0) + 1;
      }
    });
    
    return Object.entries(confidenceCounts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  };
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (suggestionData.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>AI Suggestion Metrics</CardTitle>
          <CardDescription>Track how AI suggestions are being used in your campaigns</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No suggestion data available</h3>
          <p className="text-muted-foreground mt-2">
            Start using AI suggestions in your campaign to collect usage metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>AI Suggestion Metrics</CardTitle>
        <CardDescription>
          Track how AI suggestions are being used in your campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={metricsTab} onValueChange={setMetricsTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
          </TabsList>
          
          <TabsContent value="usage" className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getUsageByType()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Suggestions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              {getUsageByType().map((item, index) => (
                <div key={item.name} className="flex items-center p-2 border rounded">
                  <Badge className="mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                    {item.value}
                  </Badge>
                  <span className="text-sm font-medium capitalize">{item.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0">
              <div className="h-[250px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getActionDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getActionDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 w-full sm:w-1/2 pl-0 sm:pl-4">
                <h3 className="text-lg font-medium">User Response to Suggestions</h3>
                <ul className="space-y-2">
                  {getActionDistribution().map((item, index) => (
                    <li key={item.name} className="flex items-center">
                      <span 
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="flex justify-between w-full">
                        <span className="text-sm">{item.name}:</span> 
                        <span className="font-medium">{item.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="confidence" className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getConfidenceLevels()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    name="Confidence Level" 
                    fill="#8884d8"
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-slate-50 rounded border text-sm">
              <h4 className="font-medium mb-2">Confidence Level Metrics</h4>
              <p className="text-muted-foreground">
                Shows the distribution of AI confidence levels across all suggestions.
                Higher confidence suggests more reliable recommendations based on available data.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
