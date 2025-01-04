import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

interface Profile {
  full_name: string | null;
  username: string | null;
  email_notifications: boolean;
  marketing_emails: boolean;
}

const Settings = () => {
  const { toast } = useToast();
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
      if (!user?.id) return null;
      
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
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="h-8 w-8" />
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <div className="grid gap-6">
        <ProfileSettings 
          user={user}
          profile={profile}
          setProfile={setProfile}
        />
        
        <NotificationSettings 
          profile={profile}
          onNotificationUpdate={handleNotificationUpdate}
        />
        
        <SubscriptionSettings 
          subscription={subscription}
          isLoadingSubscription={isLoadingSubscription}
        />
        
        <SecuritySettings />
      </div>
    </div>
  );
};

export default Settings;