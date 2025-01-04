import { Wand2, Target, Lightbulb } from "lucide-react";

export function AiFeaturesStep() {
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-start space-x-3">
        <Wand2 className="h-6 w-6 text-facebook mt-1" />
        <div>
          <p className="font-medium">Smart Content Generation</p>
          <p className="text-sm text-muted-foreground">
            Our AI analyzes your business and target audience to generate engaging ad copy and visuals that convert.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <Target className="h-6 w-6 text-facebook mt-1" />
        <div>
          <p className="font-medium">Audience Targeting</p>
          <p className="text-sm text-muted-foreground">
            Get AI-powered suggestions for targeting the right audience based on your business goals.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <Lightbulb className="h-6 w-6 text-facebook mt-1" />
        <div>
          <p className="font-medium">Creative Optimization</p>
          <p className="text-sm text-muted-foreground">
            Receive real-time suggestions to improve your ad's performance and engagement.
          </p>
        </div>
      </div>
    </div>
  );
}