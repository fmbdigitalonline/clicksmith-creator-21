import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Facebook, Instagram, Loader2, MessageSquare, Twitter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EnvConfigCheck from "@/components/integrations/EnvConfigCheck";
import FacebookConnection from "@/components/integrations/FacebookConnection";
import FacebookCampaignOverview from "@/components/integrations/FacebookCampaignOverview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function PlatformIntegrations() {
  const [platform, setPlatform] = useState<string>("facebook");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);
  const [isConnectionLoading, setIsConnectionLoading] = useState<boolean>(true);
  const [hasConnections, setHasConnections] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t("connection.connect")}</h2>
            
            <Tabs defaultValue="facebook" onValueChange={setPlatform} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="facebook" className="flex items-center justify-center">
                  <Facebook className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t("platforms.facebook")}</span>
                </TabsTrigger>
                <TabsTrigger value="instagram" className="flex items-center justify-center" disabled>
                  <Instagram className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t("platforms.instagram")}</span>
                </TabsTrigger>
                <TabsTrigger value="twitter" className="flex items-center justify-center" disabled>
                  <Twitter className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t("platforms.twitter")}</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="facebook">
                <FacebookConnection onConnectionChange={handleConnectionChange} />
              </TabsContent>
              
              <TabsContent value="instagram">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Instagram className="w-5 h-5 mr-2" /> {t("platforms.instagram")}
                    </CardTitle>
                    <CardDescription>{t("connection.not_connected")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="default">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                      <AlertDescription>
                        {t("instagram_integration_development", "Instagram integration is currently in development", { ns: "adwizard" })}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" disabled>{t("connection.connect")} {t("platforms.instagram")}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="twitter">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Twitter className="w-5 h-5 mr-2" /> {t("platforms.twitter")}
                    </CardTitle>
                    <CardDescription>{t("connection.not_connected")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="default">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                      <AlertDescription>
                        {t("twitter_integration_development", "Twitter integration is currently in development", { ns: "adwizard" })}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" disabled>{t("connection.connect")} {t("platforms.twitter")}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t("campaigns.title")}</h2>
            
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
                {platform === 'facebook' && <FacebookCampaignOverview onConnectionChange={handleConnectionChange} />}
                {platform === 'instagram' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                    <AlertDescription>
                      {t("instagram_campaign_development", "Instagram campaign management is under development", { ns: "adwizard" })}
                    </AlertDescription>
                  </Alert>
                )}
                {platform === 'twitter' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("coming_soon", "Coming Soon", { ns: "adwizard" })}</AlertTitle>
                    <AlertDescription>
                      {t("twitter_campaign_development", "Twitter campaign management is under development", { ns: "adwizard" })}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
