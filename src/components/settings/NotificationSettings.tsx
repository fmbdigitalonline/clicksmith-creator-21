import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  profile: {
    email_notifications: boolean;
    marketing_emails: boolean;
  };
  onNotificationUpdate: (key: 'email_notifications' | 'marketing_emails') => void;
}

export const NotificationSettings = ({ profile, onNotificationUpdate }: NotificationSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email updates about your projects
            </p>
          </div>
          <Switch
            checked={profile.email_notifications}
            onCheckedChange={() => onNotificationUpdate('email_notifications')}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive news and promotional emails
            </p>
          </div>
          <Switch
            checked={profile.marketing_emails}
            onCheckedChange={() => onNotificationUpdate('marketing_emails')}
          />
        </div>
      </CardContent>
    </Card>
  );
};