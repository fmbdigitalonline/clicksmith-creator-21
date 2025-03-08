
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function FacebookPermissionsGuide() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Facebook App Configuration Guide</CardTitle>
        <CardDescription>Required permissions and configuration for Facebook Ads integration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            For Facebook Ads integration to work properly, your Facebook App needs specific permissions and configuration.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium">Required Permissions</h3>
            <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
              <li><strong>ads_management</strong> - Required to create and manage ad campaigns</li>
              <li><strong>ads_read</strong> - Required to read ad account information</li>
              <li><strong>business_management</strong> - Required to access business account information</li>
              <li><strong>pages_read_engagement</strong> - Required to access page information</li>
              <li><strong>pages_show_list</strong> - Required to see list of pages</li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-medium">App Review Requirements</h3>
            <p className="text-sm mt-1">
              The permissions above require App Review approval from Facebook before your app
              can be used in production. During development, you can test with admin, developer,
              and test user accounts.
            </p>
          </div>

          <div>
            <h3 className="text-md font-medium">OAuth Configuration</h3>
            <p className="text-sm mt-1">
              Ensure your Facebook App has the following OAuth Redirect URI configured:
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono mt-2 overflow-auto">
              {window.location.origin}/integrations?connection=facebook
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium">Development Environment</h3>
            <p className="text-sm mt-1">
              When testing, make sure your Facebook App is in Development Mode and you're using
              admin, developer, or test user accounts associated with the app.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
