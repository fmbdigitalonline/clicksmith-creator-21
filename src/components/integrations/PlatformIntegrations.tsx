
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import FacebookConnection from "./FacebookConnection";
import FacebookCampaignOverview from "./FacebookCampaignOverview";
import EnvConfigCheck from "./EnvConfigCheck";
import { AutomaticModeMonitoring } from "./AutomaticModeMonitoring";
import { Facebook, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState<string>("facebook");
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  // Check if we're on a nested route
  const isMonitoringRoute = location.pathname.includes('/campaign/') && location.pathname.includes('/monitoring');
  const isCampaignRoute = location.pathname.includes('/campaign/');
  
  // Extract campaign ID if available
  const campaignId = isCampaignRoute ? 
    location.pathname.split('/campaign/')[1]?.split('/')[0] : 
    undefined;

  // Function to check Facebook campaign manager configuration
  const checkCampaignManagerConfig = async () => {
    setIsCheckingConfig(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const response = await supabase.functions.invoke('facebook-campaign-manager', {
        body: { 
          operation: 'verify_connection',
          userId: user.id
        }
      });
      
      if (response.error) {
        throw new Error(`HTTP error! status: ${response.error.message}`);
      }
      
      const result = response.data;
      
      if (result.success) {
        toast({
          title: "Campaign Manager",
          description: result.isValid 
            ? "Campaign manager is properly configured and connected."
            : result.message || "Campaign manager configured but Facebook connection is missing.",
          variant: result.isValid ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Configuration Issue",
          description: result.message || "There was an issue with the campaign manager configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking campaign manager:", error);
      toast({
        title: "Error",
        description: "Failed to connect to the campaign manager.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingConfig(false);
    }
  };

  // Function to handle campaign connection refresh
  const handleConnectionChange = () => {
    // Refresh the campaign overview
    toast({
      title: "Connection Updated",
      description: "Facebook connection has been updated.",
    });
  };

  return (
    <div className="container pb-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ad Platform Integrations</CardTitle>
          <CardDescription>
            Connect your ad accounts and manage campaigns across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnvConfigCheck />
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={checkCampaignManagerConfig} 
              disabled={isCheckingConfig}
              size="sm"
              variant="outline"
            >
              {isCheckingConfig ? "Checking..." : "Check Campaign Manager"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Routes>
        <Route 
          path="/" 
          element={
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="facebook">Facebook</TabsTrigger>
                <TabsTrigger value="google" disabled>Google Ads</TabsTrigger>
                <TabsTrigger value="tiktok" disabled>TikTok</TabsTrigger>
              </TabsList>
              
              <TabsContent value="facebook">
                <div className="space-y-6">
                  <Alert className="mb-4">
                    <Facebook className="h-4 w-4" />
                    <AlertTitle>Facebook Integration Status</AlertTitle>
                    <AlertDescription>
                      Connect your Facebook Ads account to create and manage campaigns. 
                      Make sure your Facebook App settings include the redirect URI and required permissions.
                    </AlertDescription>
                  </Alert>
                  
                  <FacebookConnection onConnectionChange={handleConnectionChange} />
                  
                  {/* Removed the duplicate Create Campaign button */}
                  
                  <FacebookCampaignOverview />
                </div>
              </TabsContent>
              
              <TabsContent value="google">
                <Card>
                  <CardHeader>
                    <CardTitle>Google Ads Integration</CardTitle>
                    <CardDescription>Connect your Google Ads account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                      Google Ads integration coming soon
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tiktok">
                <Card>
                  <CardHeader>
                    <CardTitle>TikTok Ads Integration</CardTitle>
                    <CardDescription>Connect your TikTok Ads account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                      TikTok Ads integration coming soon
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          } 
        />
        
        {/* Campaign monitoring route */}
        <Route 
          path="/campaign/:campaignId/monitoring" 
          element={
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Campaign Monitoring</h2>
                <Link to="/integrations" className="text-sm text-blue-600 hover:underline">
                  Back to Campaigns
                </Link>
              </div>
              <AutomaticModeMonitoring campaignId={campaignId} />
            </div>
          } 
        />
      </Routes>
    </div>
  );
}
