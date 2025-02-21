
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileStepProps {
  fullName: string;
  setFullName: (value: string) => void;
}

export function ProfileStep({
  fullName,
  setFullName,
}: ProfileStepProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">What's your name?</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          This is how we'll address you throughout the app.
        </p>
      </div>
    </div>
  );
}
