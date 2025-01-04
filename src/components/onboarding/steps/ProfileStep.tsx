import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileStepProps {
  fullName: string;
  setFullName: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  businessSize: string;
  setBusinessSize: (value: string) => void;
}

export function ProfileStep({
  fullName,
  setFullName,
  industry,
  setIndustry,
  businessSize,
  setBusinessSize,
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
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">What industry are you in?</Label>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger id="industry">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessSize">How big is your business?</Label>
        <Select value={businessSize} onValueChange={setBusinessSize}>
          <SelectTrigger id="businessSize">
            <SelectValue placeholder="Select business size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solo">Solo Entrepreneur</SelectItem>
            <SelectItem value="small">Small Business (2-10)</SelectItem>
            <SelectItem value="medium">Medium Business (11-50)</SelectItem>
            <SelectItem value="large">Large Business (50+)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}