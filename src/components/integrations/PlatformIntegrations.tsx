
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookConnection from "./FacebookConnection";
import EnvConfigCheck from "./EnvConfigCheck";

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState("advertising");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Integrations</h2>
        <p className="text-muted-foreground">
          Connect your ad platform accounts to create and manage campaigns
        </p>
      </div>
      
      <EnvConfigCheck />

      <Tabs defaultValue="advertising" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="advertising">Advertising</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
          <TabsTrigger value="crm" disabled>CRM</TabsTrigger>
        </TabsList>
        
        <TabsContent value="advertising" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FacebookConnection />
            
            {/* Placeholder for future platforms */}
            <Card>
              <CardHeader>
                <CardTitle>Google Ads</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Google Ads integration will be available in the next update.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Ads</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  LinkedIn Ads integration will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="p-8 text-center text-muted-foreground">
            Analytics integrations coming soon
          </div>
        </TabsContent>
        
        <TabsContent value="crm">
          <div className="p-8 text-center text-muted-foreground">
            CRM integrations coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
