
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Info, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FacebookPermissionsGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Facebook Permissions Guide
          <Info className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        <CardDescription>
          Required permissions and App Review information for ad campaign management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700">
            For production use, your Facebook App must be approved through App Review. Development testing can use your own ad accounts without approval.
          </AlertDescription>
        </Alert>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="permissions">
            <AccordionTrigger className="text-sm font-medium">Required Permissions</AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div>
                  <span className="text-sm font-semibold">ads_management</span>
                  <p className="text-xs text-muted-foreground">Create and manage ads, ad sets, and campaigns</p>
                </div>
                <div>
                  <span className="text-sm font-semibold">ads_read</span>
                  <p className="text-xs text-muted-foreground">Read advertising accounts, campaigns, and statistics</p>
                </div>
                <div>
                  <span className="text-sm font-semibold">business_management</span>
                  <p className="text-xs text-muted-foreground">Read and manage business assets like Pages and ad accounts</p>
                </div>
                <div>
                  <span className="text-sm font-semibold">pages_read_engagement</span>
                  <p className="text-xs text-muted-foreground">Read page engagement metrics</p>
                </div>
                <div>
                  <span className="text-sm font-semibold">pages_show_list</span>
                  <p className="text-xs text-muted-foreground">Access the list of Pages a user manages</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="app-review">
            <AccordionTrigger className="text-sm font-medium">App Review Requirements</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-2">
                For production use with other users, you need to submit your app for review. Prepare the following:
              </p>
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  <li>Demo video showing how each permission is used</li>
                  <li>Detailed use case descriptions for each permission</li>
                  <li>Privacy policy URL (must be publicly accessible)</li>
                  <li>App icon and details</li>
                  <li>Business verification may be required</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="testing">
            <AccordionTrigger className="text-sm font-medium">Development & Testing</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  During development, you can use these permissions with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                  <li>Your own personal Facebook account</li>
                  <li>Ad accounts where you have admin access</li>
                  <li>Test Business Manager accounts</li>
                  <li>Test Apps in development mode</li>
                </ul>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>No App Review needed for development testing</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="oauth-config">
            <AccordionTrigger className="text-sm font-medium">OAuth Configuration</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  For proper OAuth flow, configure these in your Facebook App:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                  <li>Valid OAuth Redirect URI matching your environment</li>
                  <li>Client OAuth settings enabled</li>
                  <li>Correct App Domains matching your hosting URLs</li>
                  <li>Web OAuth Login enabled</li>
                </ul>
                <div className="bg-muted p-2 rounded border text-xs mt-1">
                  <code className="break-all">{`${window.location.origin}/integrations?connection=facebook`}</code>
                  <p className="text-muted-foreground mt-1">Add this as your OAuth Redirect URI</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open("https://developers.facebook.com/docs/marketing-api/overview", "_blank")}
          >
            Marketing API Docs
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open("https://developers.facebook.com/docs/app-review", "_blank")}
          >
            App Review Guide
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => window.open("https://developers.facebook.com/apps/", "_blank")}
          >
            Open Facebook Developer Console
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
