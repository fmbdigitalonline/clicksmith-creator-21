
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FacebookPermissionsGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook Permissions Guide</CardTitle>
        <CardDescription>
          Required permissions and App Review information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Required Permissions</h3>
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
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">App Review Requirements</h3>
          <p className="text-sm text-muted-foreground">
            For development and testing, you can use these permissions with your own accounts without App Review. 
            For production use with other users, you need to submit your app for review.
          </p>
          <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
            <p>App Review submission requires:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              <li>Demo video showing how permissions are used</li>
              <li>Detailed use case descriptions</li>
              <li>Privacy policy URL</li>
              <li>App icon and details</li>
            </ul>
          </div>
        </div>
        
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
      </CardContent>
    </Card>
  );
}
