import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle } from "lucide-react";
import { AdHook } from "@/types/adWizard";

interface HookCardProps {
  hook: AdHook;
  index: number;
  isSelected: boolean;
  onToggle: (hook: AdHook) => void;
}

const HookCard = ({ hook, index, isSelected, onToggle }: HookCardProps) => {
  return (
    <Card
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-facebook ring-1 ring-facebook' : 'hover:border-facebook/50'
      }`}
      onClick={() => onToggle(hook)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent transition-opacity duration-200 rounded-xl ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
      }`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-5 h-5 text-facebook" />
            <CardTitle className="text-lg">Marketing Angle {index + 1}</CardTitle>
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(hook)}
            className="data-[state=checked]:bg-facebook data-[state=checked]:border-facebook"
          />
        </div>
        <CardDescription className="text-base font-medium text-gray-700">
          {hook.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-facebook font-semibold mb-1">Hook:</p>
          <p className="text-gray-800">{hook.text}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HookCard;