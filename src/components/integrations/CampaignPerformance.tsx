
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RefreshCw, BarChart3, LineChart, PieChart, TrendingUp, Loader2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, subDays, parse } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  LineChart as ReLineChart, 
  Line, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Define the interface for Facebook Insights data
interface InsightsData {
  data: Array<{
    campaign_id: string;
    campaign_name: string;
    impressions: number;
    reach: number;
    clicks: number;
    spend: number;
    cpc: number;
    ctr: number;
    unique_clicks: number;
    actions?: Array<{
      action_type: string;
      value: number;
    }>;
    date_start?: string;
    date_stop?: string;
  }>;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

// Define types for date range selection
type DateRange = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

// Define props for the component
interface CampaignPerformanceProps {
  campaignId: string;
  campaignName?: string;
}

const formatCurrency = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatPercentage = (value: number) => {
  return (value * 100).toFixed(2) + '%';
};

export default function CampaignPerformance({ campaignId, campaignName }: CampaignPerformanceProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [from, setFrom] = useState<Date>(subDays(new Date(), 30));
  const [to, setTo] = useState<Date>(new Date());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [performanceMetric, setPerformanceMetric] = useState<string>('impressions');
  
  const session = useSession();
  const { toast } = useToast();

  // Helper to get date range based on selection
  const getDateRange = () => {
    const today = new Date();
    
    switch (dateRange) {
      case 'last7days':
        return { from: subDays(today, 7), to: today };
      case 'last30days':
        return { from: subDays(today, 30), to: today };
      case 'thisMonth':
        return { 
          from: new Date(today.getFullYear(), today.getMonth(), 1), 
          to: today 
        };
      case 'lastMonth':
        return { 
          from: new Date(today.getFullYear(), today.getMonth() - 1, 1), 
          to: new Date(today.getFullYear(), today.getMonth(), 0) 
        };
      case 'custom':
        return customDateRange;
      default:
        return { from: subDays(today, 30), to: today };
    }
  };

  // Fetch campaign insights data
  const fetchInsights = async (refreshing = false) => {
    if (!session || !campaignId) return;
    
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const dateRangeValue = getDateRange();
      const dateFrom = format(dateRangeValue.from, 'yyyy-MM-dd');
      const dateTo = format(dateRangeValue.to, 'yyyy-MM-dd');
      
      const metrics = [
        'reach',
        'impressions',
        'clicks',
        'spend',
        'cpc',
        'ctr',
        'unique_clicks',
        'actions'
      ];
      
      // Call the Edge Function to fetch insights
      const { data, error } = await supabase.functions.invoke('facebook-campaign-insights', {
        body: {
          campaignId,
          dateFrom,
          dateTo,
          metrics
        }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to fetch insights");
      }
      
      if (!data.success) {
        throw new Error(data.error || "Could not retrieve campaign insights");
      }
      
      setInsights(data.data);
      
      toast({
        title: refreshing ? "Data refreshed" : "Insights loaded",
        description: `Campaign performance data is now up to date`,
      });
    } catch (error) {
      console.error("Error fetching insights:", error);
      setError(error.message || "Failed to load campaign performance data");
      toast({
        title: "Error",
        description: error.message || "Failed to load campaign performance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (session && campaignId) {
      fetchInsights();
    }
  }, [campaignId, session]);
  
  // Refetch when date range changes
  useEffect(() => {
    if (session && campaignId) {
      fetchInsights();
    }
  }, [dateRange, customDateRange]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchInsights(true);
  };
  
  // Handle date range selection
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  
  // Handle custom date selection
  const handleCustomDateChange = (date: Date, type: 'from' | 'to') => {
    setCustomDateRange(prev => ({
      ...prev,
      [type]: date
    }));
  };
  
  // Apply custom date range
  const applyCustomDateRange = () => {
    setFrom(customDateRange.from);
    setTo(customDateRange.to);
    setDateRange('custom');
  };

  // Prepare data for charts
  const prepareChartData = () => {
    if (!insights || !insights.data || insights.data.length === 0) {
      return [];
    }
    
    // For simplicity, use the first data point
    const data = insights.data[0];
    
    // Create chart data based on the selected metric
    const chartData = [
      { name: 'Reach', value: data.reach || 0 },
      { name: 'Impressions', value: data.impressions || 0 },
      { name: 'Clicks', value: data.clicks || 0 },
      { name: 'Unique Clicks', value: data.unique_clicks || 0 },
    ];
    
    // Add conversion data if available
    if (data.actions) {
      data.actions.forEach(action => {
        if (action.action_type.includes('conversion')) {
          chartData.push({
            name: `${action.action_type.replace('_', ' ')}`,
            value: action.value
          });
        }
      });
    }
    
    return chartData;
  };
  
  // Calculate key performance indicators
  const calculateKPIs = () => {
    if (!insights || !insights.data || insights.data.length === 0) {
      return {
        impressions: 0,
        reach: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        spend: 0
      };
    }
    
    // For simplicity, use the first data point
    const data = insights.data[0];
    
    return {
      impressions: data.impressions || 0,
      reach: data.reach || 0,
      clicks: data.clicks || 0,
      ctr: data.ctr || 0,
      cpc: data.cpc || 0,
      spend: data.spend || 0
    };
  };
  
  // Export data as CSV
  const exportData = () => {
    if (!insights || !insights.data) return;
    
    // Convert insights data to CSV
    const headers = "Campaign Name,Impressions,Reach,Clicks,CTR,CPC,Spend\n";
    const rows = insights.data.map(row => 
      `"${row.campaign_name}",${row.impressions || 0},${row.reach || 0},${row.clicks || 0},${row.ctr || 0},${row.cpc || 0},${row.spend || 0}`
    ).join("\n");
    
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chartData = prepareChartData();
  const kpis = calculateKPIs();
  
  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Loading metrics and insights...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary/70" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Campaign Performance</CardTitle>
            <CardDescription>{campaignName || "Performance metrics and insights"}</CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Select
              value={dateRange}
              onValueChange={(value) => handleDateRangeChange(value as DateRange)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {dateRange === 'custom' && (
              <div className="flex items-center ml-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {format(customDateRange.from, "MMM d")} - {format(customDateRange.to, "MMM d, yyyy")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex flex-col gap-4 w-auto p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Start Date</h4>
                      <Calendar
                        mode="single"
                        selected={customDateRange.from}
                        onSelect={(date) => date && handleCustomDateChange(date, 'from')}
                        disabled={(date) => date > customDateRange.to || date > new Date()}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">End Date</h4>
                      <Calendar
                        mode="single"
                        selected={customDateRange.to}
                        onSelect={(date) => date && handleCustomDateChange(date, 'to')}
                        disabled={(date) => date < customDateRange.from || date > new Date()}
                      />
                    </div>
                    <Button onClick={applyCustomDateRange}>Apply</Button>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={exportData}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !insights || insights.data.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No performance data available</h3>
            <p className="text-muted-foreground mb-4">
              This campaign hasn't generated any metrics yet or hasn't been running long enough.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(kpis.impressions)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <LineChart className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(kpis.clicks)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Spend</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(kpis.spend)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Chart Section */}
            <div>
              <Tabs defaultValue="overview" className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reach">Reach & Impressions</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={chartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Bar
                    </Button>
                    <Button
                      variant={chartType === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('line')}
                    >
                      <LineChart className="h-4 w-4 mr-2" />
                      Line
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <ReBarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#3b82f6" name="Value" />
                        </ReBarChart>
                      ) : (
                        <ReLineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" activeDot={{ r: 8 }} name="Value" />
                        </ReLineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="reach">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Reach</CardTitle>
                          <CardDescription>Unique users who saw your ads</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatNumber(kpis.reach)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Impressions</CardTitle>
                          <CardDescription>Total number of times your ads were shown</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatNumber(kpis.impressions)}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="engagement">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Clicks</CardTitle>
                          <CardDescription>Users who clicked on your ads</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatNumber(kpis.clicks)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">CTR</CardTitle>
                          <CardDescription>Click-through rate</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatPercentage(kpis.ctr)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">CPC</CardTitle>
                          <CardDescription>Cost per click</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatCurrency(kpis.cpc)}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {insights && insights.data && insights.data.length > 0 ? (
            `Data from ${format(from, "MMM d, yyyy")} to ${format(to, "MMM d, yyyy")}`
          ) : (
            "No data available for the selected time period"
          )}
        </div>
        <div className="text-sm">
          <Button variant="link" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh data"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
