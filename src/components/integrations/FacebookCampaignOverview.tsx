
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Plus, RefreshCw, AlertCircle, CheckCircle2, PlusCircle, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FacebookCampaignOverviewProps {
  connection?: {
    platform: string;
    metadata?: {
      adAccounts?: Array<{id: string; name: string}>;
      pages?: Array<{id: string; name: string; access_token?: string}>;
      selectedAdAccountId?: string;
      selectedPageId?: string;
    };
  };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  budget_remaining: number;
}

interface AccountDetails {
  id: string;
  name: string;
  account_status: number;
  amount_spent: number;
  balance: number;
  currency: string;
}

export default function FacebookCampaignOverview({ connection }: FacebookCampaignOverviewProps) {
  const [adAccounts, setAdAccounts] = useState<Array<{id: string; name: string}>>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>("");
  const [pages, setPages] = useState<Array<{id: string; name: string}>>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("REACH");
  const [campaignBudget, setCampaignBudget] = useState("10");
  const [campaignHeadline, setCampaignHeadline] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [campaignLink, setCampaignLink] = useState("https://");
  
  const { toast } = useToast();

  useEffect(() => {
    if (connection?.metadata?.adAccounts) {
      setAdAccounts(connection.metadata.adAccounts);
      
      // Auto-select the first ad account if none is selected
      if (connection.metadata.adAccounts.length > 0 && !selectedAdAccount) {
        const defaultAccount = connection.metadata.selectedAdAccountId || connection.metadata.adAccounts[0].id;
        setSelectedAdAccount(defaultAccount);
      }
    }
    
    if (connection?.metadata?.pages) {
      setPages(connection.metadata.pages);
      
      // Auto-select the first page if none is selected
      if (connection.metadata.pages.length > 0 && !selectedPage) {
        const defaultPage = connection.metadata.selectedPageId || connection.metadata.pages[0].id;
        setSelectedPage(defaultPage);
      }
    }
  }, [connection]);

  useEffect(() => {
    if (selectedAdAccount) {
      fetchAccountDetails();
      fetchCampaigns();
    }
  }, [selectedAdAccount]);

  const fetchAccountDetails = async () => {
    if (!selectedAdAccount) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('create-facebook-campaign', {
        body: { 
          action: 'get_ad_account_details',
          adAccountId: selectedAdAccount
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.success && response.data?.accountDetails) {
        setAccountDetails(response.data.accountDetails);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast({
        title: "Error",
        description: "Failed to load account details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedAdAccount) return;
    
    setIsCampaignsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('create-facebook-campaign', {
        body: { 
          action: 'get_campaigns',
          adAccountId: selectedAdAccount
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.success && response.data?.campaigns) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCampaignsLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedAdAccount || !selectedPage || !campaignName) {
      toast({
        title: "Missing Information",
        description: "Please provide campaign name, ad account, and page.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingCampaign(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const campaignData = {
        name: campaignName,
        objective: campaignObjective,
        status: "PAUSED", // Always start as paused for safety
        adSetName: `${campaignName} Ad Set`,
        adName: `${campaignName} Ad`,
        dailyBudget: parseFloat(campaignBudget) * 100, // Convert to cents
        headline: campaignHeadline,
        description: campaignDescription,
        link: campaignLink,
        pageId: selectedPage,
      };

      const response = await supabase.functions.invoke('create-facebook-campaign', {
        body: { 
          action: 'create_campaign',
          adAccountId: selectedAdAccount,
          campaignData
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.success) {
        toast({
          title: "Campaign Created",
          description: "Your campaign has been created successfully. It is currently paused and ready for review.",
        });
        
        // Reset form
        setCampaignName("");
        setCampaignHeadline("");
        setCampaignDescription("");
        setCampaignLink("https://");
        
        // Refresh campaigns list
        fetchCampaigns();
      } else {
        throw new Error(response.data?.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return "bg-green-100 text-green-800 border-green-200";
      case 'PAUSED':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'ARCHIVED':
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 'DELETED':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Facebook Campaigns</span>
            {adAccounts.length > 0 && (
              <Select value={selectedAdAccount} onValueChange={setSelectedAdAccount}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select Ad Account" />
                </SelectTrigger>
                <SelectContent>
                  {adAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardTitle>
          <CardDescription>
            Create and manage your Facebook ad campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-facebook mr-2" />
              <p>Loading account details...</p>
            </div>
          ) : !selectedAdAccount ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Ad Account Selected</AlertTitle>
              <AlertDescription>
                Please select a Facebook Ads account to continue.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="campaigns" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="create">Create Campaign</TabsTrigger>
                <TabsTrigger value="account">Account Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="campaigns">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Your Campaigns</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchCampaigns}
                      disabled={isCampaignsLoading}
                    >
                      {isCampaignsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  
                  {isCampaignsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-facebook mr-2" />
                      <p>Loading campaigns...</p>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="font-medium text-lg mb-2">No campaigns found</h3>
                      <p className="text-gray-500 mb-4">You haven't created any campaigns for this ad account yet.</p>
                      <Button className="mx-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Your First Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="overflow-hidden">
                          <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{campaign.name}</CardTitle>
                                <CardDescription className="text-xs">ID: {campaign.id}</CardDescription>
                              </div>
                              <Badge className={getStatusBadgeColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Objective</p>
                                <p className="font-medium">{campaign.objective}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Created</p>
                                <p className="font-medium">{new Date(campaign.created_time).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Budget Remaining</p>
                                <p className="font-medium">{formatCurrency(campaign.budget_remaining / 100)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="create">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-2">Create a New Campaign</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Set up a new Facebook ad campaign to promote your business.
                      All campaigns are created in paused state so you can review before launching.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="campaign-name">Campaign Name</Label>
                          <Input 
                            id="campaign-name" 
                            placeholder="Enter campaign name" 
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="campaign-objective">Campaign Objective</Label>
                          <Select value={campaignObjective} onValueChange={setCampaignObjective}>
                            <SelectTrigger id="campaign-objective">
                              <SelectValue placeholder="Select objective" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REACH">Reach</SelectItem>
                              <SelectItem value="TRAFFIC">Traffic</SelectItem>
                              <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                              <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
                              <SelectItem value="CONVERSIONS">Conversions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="daily-budget">Daily Budget (USD)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              id="daily-budget" 
                              type="number" 
                              className="pl-10" 
                              min="1"
                              step="0.01"
                              value={campaignBudget}
                              onChange={(e) => setCampaignBudget(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="page">Facebook Page</Label>
                          <Select value={selectedPage} onValueChange={setSelectedPage}>
                            <SelectTrigger id="page">
                              <SelectValue placeholder="Select page" />
                            </SelectTrigger>
                            <SelectContent>
                              {pages.map(page => (
                                <SelectItem key={page.id} value={page.id}>
                                  {page.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="headline">Ad Headline</Label>
                        <Input 
                          id="headline" 
                          placeholder="Enter compelling headline" 
                          value={campaignHeadline}
                          onChange={(e) => setCampaignHeadline(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Ad Description</Label>
                        <Textarea 
                          id="description" 
                          placeholder="Enter ad description" 
                          rows={3}
                          value={campaignDescription}
                          onChange={(e) => setCampaignDescription(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="link">Destination URL</Label>
                        <Input 
                          id="link" 
                          placeholder="https://your-website.com" 
                          value={campaignLink}
                          onChange={(e) => setCampaignLink(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreateCampaign}
                      disabled={isCreatingCampaign || !campaignName || !selectedPage}
                    >
                      {isCreatingCampaign ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="account">
                {accountDetails ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Account Name</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{accountDetails.name}</p>
                          <p className="text-sm text-gray-500">ID: {accountDetails.id}</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Account Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCurrency(accountDetails.balance / 100, accountDetails.currency)}
                          </p>
                          <p className="text-sm text-gray-500">Available for ads</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {formatCurrency(accountDetails.amount_spent / 100, accountDetails.currency)}
                          </p>
                          <p className="text-sm text-gray-500">Lifetime spend</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          {accountDetails.account_status === 1 ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <p>Your account is active and in good standing</p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5 text-red-500" />
                              <p>
                                Your account has an issue that needs attention 
                                (Status code: {accountDetails.account_status})
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 border-t">
                        <p className="text-sm text-gray-500">
                          To manage billing or resolve issues, visit your 
                          <a 
                            href="https://business.facebook.com/settings/ad-accounts" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1"
                          >
                            Facebook Ad Account Settings
                          </a>
                        </p>
                      </CardFooter>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-2">No account details available</h3>
                    <p className="text-gray-500">Select an ad account to view details</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
