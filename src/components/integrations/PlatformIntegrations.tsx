
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, AlertTriangle, Facebook, Instagram, Loader2, MessageSquare, 
  Twitter, Plus, LayoutGrid, ChevronDown, RefreshCw, Youtube
} from "lucide-react";
import { SiTiktok, SiGoogle } from "react-icons/si";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EnvConfigCheck from "@/components/integrations/EnvConfigCheck";
import FacebookConnection from "@/components/integrations/FacebookConnection";
import FacebookCampaignOverview from "@/components/integrations/FacebookCampaignOverview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [platform, setPlatform] = useState<string>("facebook");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);
  const [isConnectionLoading, setIsConnectionLoading] = useState<boolean>(true);
  const [hasConnections, setHasConnections] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const { toast } = useToast();
  const session = useSession();
  const { t } = useTranslation("integrations");

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session) {
        try {
          const { data, error } = await supabase.rpc('is_admin');
          if (!error && data) {
            setIsAdmin(data);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };
    
    checkAdminStatus();
  }, [session]);

  useEffect(() => {
    const checkConfig = () => {
      const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
      const facebookRedirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI;
      
      if (isAdmin) {
        console.log("Facebook environment variables:", {
          appId: !!facebookAppId,
          redirectUri: !!facebookRedirectUri
        });
      }
      
      setIsConfigured(!!facebookAppId && !!facebookRedirectUri);
      setIsConfigLoading(false);
    };
    
    checkConfig();
  }, [isAdmin]);
  
  useEffect(() => {
    async function checkConnections() {
      if (!session?.user?.id) {
        setIsConnectionLoading(false);
        return;
      }
      
      try {
        setIsConnectionLoading(true);
        const { data, error } = await supabase
          .from('platform_connections')
          .select('platform')
          .eq('user_id', session.user.id);
          
        if (error) throw error;
        
        setHasConnections(data && data.length > 0);
      } catch (error) {
        console.error("Error checking connections:", error);
        toast({
          title: "Error",
          description: "Failed to check platform connections",
          variant: "destructive",
        });
      } finally {
        setIsConnectionLoading(false);
      }
    }
    
    checkConnections();
  }, [session, toast]);
  
  const handleConnectionChange = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('platform')
        .eq('user_id', session.user.id);
        
      if (error) throw error;
      
      setHasConnections(data && data.length > 0);
    } catch (error) {
      console.error("Error refreshing connections:", error);
    }
  };

  if (!isConfigLoading && !isConfigured && isAdmin) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <EnvConfigCheck />
      </div>
    );
  } else if (!isConfigLoading && !isConfigured && !isAdmin) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("errors.configuration")}</AlertTitle>
          <AlertDescription>
            {t("errors.try_again")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (isConfigLoading || isConnectionLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="sticky top-16 z-10 bg-background pb-3 pt-1">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connections">
              {t("connection.connect")}
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              {t("campaigns.title")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connection Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t("connection.connect")}</CardTitle>
                <CardDescription>Manage your platform connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Facebook Ads</span>
                    </div>
                    <div>
                      {hasConnections ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          {t("connection.connected")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t("connection.not_connected")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-5 w-5 text-pink-600" />
                      <span className="font-medium">Instagram</span>
                    </div>
                    <div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <SiGoogle className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Google Ads</span>
                    </div>
                    <div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <SiTiktok className="h-5 w-5" />
                      <span className="font-medium">TikTok</span>
                    </div>
                    <div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      <span className="font-medium">X (Twitter)</span>
                    </div>
                    <div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setActiveTab("connections")} 
                  variant="outline" 
                  className="w-full"
                >
                  Manage Connections
                </Button>
              </CardFooter>
            </Card>

            {/* Campaign Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {t("campaigns.title")}
                  </CardTitle>
                  <CardDescription>Your active campaigns</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Campaigns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <span>Facebook</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasConnections ? (
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Not Connected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => setActiveTab("campaigns")} 
                          variant="ghost" 
                          size="sm"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <SiGoogle className="h-4 w-4 text-blue-500" />
                          <span>Google Ads</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Coming Soon</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <SiTiktok className="h-4 w-4" />
                          <span>TikTok</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Coming Soon</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span>Instagram</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Coming Soon</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setActiveTab("campaigns")} 
                  variant="outline" 
                  className="w-full"
                >
                  Manage Campaigns
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("connection.connect")}</CardTitle>
              <CardDescription>Connect your social media platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="facebook" onValueChange={setPlatform} className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-4">
                  <TabsTrigger value="facebook" className="flex items-center justify-center">
                    <Facebook className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t("platforms.facebook")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="instagram" className="flex items-center justify-center" disabled>
                    <Instagram className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t("platforms.instagram")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="google" className="flex items-center justify-center" disabled>
                    <SiGoogle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Google</span>
                  </TabsTrigger>
                  <TabsTrigger value="tiktok" className="flex items-center justify-center" disabled>
                    <SiTiktok className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">TikTok</span>
                  </TabsTrigger>
                  <TabsTrigger value="twitter" className="flex items-center justify-center" disabled>
                    <Twitter className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">X (Twitter)</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="facebook">
                  <FacebookConnection onConnectionChange={handleConnectionChange} />
                </TabsContent>
                
                <TabsContent value="instagram">
                  <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                    <AlertDescription>
                      {t("instagram_integration_development", "Instagram integration is currently in development", { ns: "adwizard" })}
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="google">
                  <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                    <AlertDescription>
                      Google Ads integration is currently in development
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="tiktok">
                  <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                    <AlertDescription>
                      TikTok integration is currently in development
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="twitter">
                  <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                    <AlertDescription>
                      {t("twitter_integration_development", "Twitter integration is currently in development", { ns: "adwizard" })}
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          {!session ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("auth.required", "Authentication Required", { ns: "auth" })}</AlertTitle>
              <AlertDescription>
                {t("auth.signin_required", "Please sign in to manage your platform campaigns", { ns: "auth" })}
              </AlertDescription>
            </Alert>
          ) : !hasConnections ? (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertTitle>{t("no_connected_platforms", "No Connected Platforms", { ns: "adwizard" })}</AlertTitle>
              <AlertDescription>
                {t("connect_platform_message", "Connect a platform on the left to start managing your campaigns", { ns: "adwizard" })}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Facebook Campaigns</CardTitle>
                    <CardDescription>
                      Create and manage your Facebook ad campaigns
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FacebookCampaignOverview onConnectionChange={handleConnectionChange} />
                </CardContent>
              </Card>

              {/* Templates Section */}
              <Collapsible 
                open={isTemplatesOpen} 
                onOpenChange={setIsTemplatesOpen}
                className="bg-white border rounded-lg shadow-sm"
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex w-full justify-between p-6 font-medium text-left"
                  >
                    <div className="flex items-center">
                      <LayoutGrid className="h-5 w-5 mr-2" />
                      <span className="text-xl">Campaign Templates</span>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 transition-transform ${isTemplatesOpen ? "transform rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                  <p className="mb-4 text-muted-foreground">
                    Reuse your successful campaigns with these saved templates
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map((template) => (
                      <Card key={template} className="overflow-hidden">
                        <div className="flex border-b">
                          <div className="w-1/3 h-24 bg-gray-200">
                            {/* Placeholder for template image */}
                          </div>
                          <div className="flex-1 p-4">
                            <h3 className="font-medium">Launch Campaign Template {template}</h3>
                            <p className="text-sm text-muted-foreground">
                              Facebook Template • Created 2 months ago
                            </p>
                          </div>
                        </div>
                        <div className="p-3 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Used 3 times
                          </span>
                          <Button size="sm" variant="outline">
                            Use Template
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
