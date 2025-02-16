
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileStepProps {
  fullName: string;
  setFullName: (value: string) => void;
}

export function ProfileStep({
  fullName,
  setFullName,
}: ProfileStepProps) {
  const { toast } = useToast();

  const handleNameUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your name has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">What's your name?</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            handleNameUpdate();
          }}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          This is how we'll address you throughout the app.
        </p>
      </div>
    </div>
  );
}
