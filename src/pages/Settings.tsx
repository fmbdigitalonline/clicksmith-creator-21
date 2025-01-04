import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", username: "" });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plan:plans(*)")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    getUser();
  }, []);

  const handleNotificationUpdate = async (settings: any) => {
    // Handle notification settings update
    console.log("Updating notification settings:", settings);
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileSettings 
            user={user}
            profile={profile}
            setProfile={setProfile}
          />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings 
            profile={profile}
            onNotificationUpdate={handleNotificationUpdate}
          />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="subscription">
          <SubscriptionSettings 
            subscription={subscription}
            isLoadingSubscription={isLoadingSubscription}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;