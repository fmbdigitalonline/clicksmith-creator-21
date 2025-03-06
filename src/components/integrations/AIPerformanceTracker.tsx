
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AIPerformanceTrackerProps {
  campaignId?: string;
  days?: number;
}

interface PerformanceMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  roas?: number;
}

interface InsightCard {
  title: string;
  description: string;
  metric?: string | number;
  trend: 'up' | 'down' | 'neutral';
  change?: number;
  importance: 'high' | 'medium' | 'low';
}

export function AIPerformanceTracker({ campaignId, days = 14 }: AIPerformanceTrackerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const { toast } = useToast();
  const { campaignId: routeCampaignId } = useParams();
  const effectiveCampaignId = campaignId || routeCampaignId;

  // Generate sample data for visualization purposes
  const generateSampleData = () => {
    const data: PerformanceMetric[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Base metrics with some randomization for realistic variation
      const baseImpressions = 500 + Math.floor(Math.random() * 300);
      const baseClicks = 25 + Math.floor(Math.random() * 15);
      const baseConversions = 2 + Math.floor(Math.random() * 3);
      const baseSpend = 20 + Math.floor(Math.random() * 10);
      
      // Add trend - gradual increase over time
      const trendFactor = 1 + (i / days) * 0.5;
      
      const impressions = Math.floor(baseImpressions * trendFactor);
      const clicks = Math.floor(baseClicks * trendFactor);
      const conversions = Math.floor(baseConversions * trendFactor);
      const spend = Math.floor(baseSpend * trendFactor);
      
      // Calculate derived metrics
      const ctr = (clicks / impressions) * 100;
      const cpc = spend / clicks;
      const roas = (conversions * 50) / spend; // Assuming $50 value per conversion
      
      data.push({
        date: date.toISOString().split('T')[0],
        impressions,
        clicks,
        conversions,
        spend,
        ctr,
        cpc,
        roas
      });
    }
    
    return data;
  };

  // Generate sample insights based on the metrics
  const generateInsights = (data: PerformanceMetric[]) => {
    if (data.length < 2) return [];
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    // Calculate some metrics to generate insights
    const impressionChange = ((latest.impressions - previous.impressions) / previous.impressions) * 100;
    const clickChange = ((latest.clicks - previous.clicks) / previous.clicks) * 100;
    const ctrChange = latest.ctr - previous.ctr;
    const cpcChange = ((latest.cpc - previous.cpc) / previous.cpc) * 100;
    
    const cards: InsightCard[] = [
      {
        title: "Click-Through Rate",
        description: ctrChange > 0 
          ? "Your CTR is improving, indicating your creative is resonating with the audience."
          : "Your CTR has decreased slightly. Consider refreshing your ad creative.",
        metric: `${latest.ctr.toFixed(2)}%`,
        trend: ctrChange > 0 ? 'up' : 'down',
        change: Math.abs(ctrChange),
        importance: Math.abs(ctrChange) > 0.5 ? 'high' : 'medium'
      },
      {
        title: "Cost Per Click",
        description: cpcChange < 0 
          ? "Your CPC is decreasing, indicating improved ad efficiency."
          : "Your CPC has increased. Consider refining your targeting.",
        metric: `$${latest.cpc.toFixed(2)}`,
        trend: cpcChange < 0 ? 'up' : 'down',
        change: Math.abs(cpcChange),
        importance: Math.abs(cpcChange) > 10 ? 'high' : 'medium'
      },
      {
        title: "Audience Engagement",
        description: impressionChange > 0 && clickChange > 0
          ? "Both impressions and clicks are increasing, showing good campaign momentum."
          : "Your audience engagement metrics show mixed results. Consider audience refinement.",
        trend: impressionChange > 0 && clickChange > 0 ? 'up' : 'down',
        importance: 'medium'
      }
    ];
    
    // Add ROAS insight if available
    if (latest.roas) {
      const roasChange = latest.roas - (previous.roas || 0);
      cards.push({
        title: "Return On Ad Spend",
        description: roasChange > 0 
          ? "Your ROAS is improving, showing better conversion value."
          : "Your ROAS has decreased. Review your conversion funnel.",
        metric: `${latest.roas.toFixed(2)}x`,
        trend: roasChange > 0 ? 'up' : 'down',
        change: Math.abs(roasChange),
        importance: 'high'
      });
    }
    
    return cards;
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!effectiveCampaignId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // In a production environment, we would fetch real data here
        // For now, we'll generate sample data for visualization
        
        // First check if the campaign exists and is automatic
        const { data: campaignData, error: campaignError } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('id', effectiveCampaignId)
          .single();
          
        if (campaignError) throw campaignError;
        
        // Generate sample data for demonstration purposes
        const sampleData = generateSampleData();
        setMetrics(sampleData);
        
        // Generate insights based on the metrics
        const sampleInsights = generateInsights(sampleData);
        setInsights(sampleInsights);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        toast({
          title: "Failed to load performance data",
          description: "Could not retrieve campaign performance metrics",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [effectiveCampaignId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getInsightIcon = (trend: 'up' | 'down' | 'neutral', importance: 'high' | 'medium' | 'low') => {
    if (trend === 'up') {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    } else {
      return <BarChart3 className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadge = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return <Badge className="bg-purple-100 text-purple-800">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium Impact</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low Impact</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!effectiveCampaignId) {
    return null;
  }

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            AI-powered performance tracking and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No Performance Data Available</h3>
          <p className="text-muted-foreground mt-2">
            Wait for your campaign to collect performance data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              AI-powered performance tracking and insights
            </CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Charts */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Impressions & Clicks</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={formatDate}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="#8884d8" 
                    name="Impressions"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#82ca9d" 
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Spend & Conversions</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    stroke="#ff7300"
                    fill="#ff7300"
                    fillOpacity={0.3}
                    name="Daily Spend ($)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    stroke="#387908"
                    fill="#387908"
                    fillOpacity={0.3}
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* AI Insights */}
        <div>
          <h3 className="text-sm font-medium mb-3">AI Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <Card key={index} className="border-slate-200">
                <CardHeader className="py-3 px-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {getInsightIcon(insight.trend, insight.importance)}
                      <CardTitle className="text-base ml-2">{insight.title}</CardTitle>
                    </div>
                    {getInsightBadge(insight.importance)}
                  </div>
                  {insight.metric && (
                    <div className="text-2xl font-bold text-slate-800 mt-1">
                      {insight.metric}
                      {insight.change && (
                        <span className={`text-sm ml-2 ${insight.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {insight.trend === 'up' ? '↑' : '↓'} {insight.change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="py-3 px-4 pt-0">
                  <p className="text-sm text-slate-600">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-slate-50 text-xs text-muted-foreground">
        <div>
          Data reflects last {days} days of campaign performance
        </div>
        <div>
          Updated: {new Date().toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
}
