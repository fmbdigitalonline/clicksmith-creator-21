import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Settings2, Bell, Shield, User as UserIcon, CreditCard } from "lucide-react";

interface Subscription {
  id: string;
  plan_id: string;
  credits_remaining: number;
  active: boolean;
  current_period_end: string;
  plan: {
    name: string;
    price: number;
    credits: number;
  };
}

interface Profile {
  full_name: string | null;
  username: string | null;
  email_notifications: boolean;
  marketing_emails: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    username: "",
    email_notifications: true,
    marketing_emails: false,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile(prev => ({
            ...prev,
            full_name: profileData.full_name,
            username: profileData.username,
          }));
        }
      }
    };
    
    getUser();
  }, []);

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(
            name,
            price,
            credits
          )
        `)
        .eq('user_id', user?.id)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!user,
  });

  const handleProfileUpdate = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        username: profile.username,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleNotificationUpdate = async (key: 'email_notifications' | 'marketing_emails') => {
    setProfile(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal session error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management portal.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="h-8 w-8" />
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Choose a username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
            </div>
            <Button onClick={handleProfileUpdate}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

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
                onCheckedChange={() => handleNotificationUpdate('email_notifications')}
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
                onCheckedChange={() => handleNotificationUpdate('marketing_emails')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Subscription</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSubscription ? (
              <div>Loading subscription details...</div>
            ) : subscription ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Plan</span>
                    <span className="text-lg font-semibold">{subscription.plan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Credits Remaining</span>
                    <span className="text-lg font-semibold">{subscription.credits_remaining}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Renewal Date</span>
                    <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button onClick={handleManageSubscription} className="w-full">
                  Manage Subscription
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p>You don't have an active subscription.</p>
                <Button onClick={handleUpgrade} className="w-full">
                  Upgrade Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;