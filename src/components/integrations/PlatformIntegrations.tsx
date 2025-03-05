
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookConnection from "@/components/integrations/FacebookConnection";
import FacebookCampaignOverview from "@/components/integrations/FacebookCampaignOverview";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState("integrations");
  const [hasConnections, setHasConnections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const session = useSession();

  // Check if any platform is connected
  useEffect(() => {
    const checkConnections = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Checking for any platform connections...");
        const { data, error } = await supabase
          .from('platform_connections')
          .select('platform')
          .limit(1);
        
        if (error) {
          console.error("Error checking connections:", error);
          setHasConnections(false);
        } else {
          const hasAnyConnection = data && data.length > 0;
          console.log("Has connections:", hasAnyConnection, data);
          setHasConnections(hasAnyConnection);
          
          // If we have connections and the user is on the integrations tab,
          // we can show the campaigns tab by default
          if (hasAnyConnection && activeTab === "integrations") {
            setActiveTab("campaigns");
          }
        }
      } catch (error) {
        console.error("Exception checking connections:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnections();
  }, [session, activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Connect your ad accounts to automate campaign creation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Connect Platforms</TabsTrigger>
          <TabsTrigger value="campaigns">Create Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Platform Connections</CardTitle>
              <CardDescription>
                Connect your advertising accounts to automate ad creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FacebookConnection />
              
              <Separator className="my-6" />
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>More platforms coming soon</AlertTitle>
                <AlertDescription>
                  We're working on adding Google Ads, TikTok Ads, and other platforms.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          {!hasConnections && !isLoading ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Connected Platforms</AlertTitle>
              <AlertDescription>
                You need to connect at least one ad platform before creating campaigns.
              </AlertDescription>
            </Alert>
          ) : (
            <FacebookCampaignOverview />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
