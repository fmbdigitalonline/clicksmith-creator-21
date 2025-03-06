
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FacebookDiagnostic from "@/components/integrations/FacebookDiagnostic";
import FacebookConnection from "@/components/integrations/FacebookConnection";
import FacebookCampaignOverview from "@/components/integrations/FacebookCampaignOverview";

export default function DiagnosticPage() {
  return (
    <>
      <Helmet>
        <title>System Diagnostic</title>
      </Helmet>
      
      <div className="container max-w-7xl py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Diagnostic</h1>
          <p className="text-muted-foreground mt-2">
            Diagnose and troubleshoot platform integrations
          </p>
        </div>
        
        <Tabs defaultValue="diagnostic">
          <TabsList>
            <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnostic" className="space-y-6 mt-6">
            <FacebookDiagnostic />
          </TabsContent>
          
          <TabsContent value="connection" className="space-y-6 mt-6">
            <FacebookConnection />
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-6 mt-6">
            <FacebookCampaignOverview />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
