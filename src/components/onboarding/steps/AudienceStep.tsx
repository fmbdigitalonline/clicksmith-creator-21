
import { Users, CheckCircle2 } from "lucide-react";

export function AudienceStep() {
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-start space-x-3">
        <Users className="h-6 w-6 text-facebook mt-1" />
        <div>
          <p className="font-medium">Advanced Targeting</p>
          <p className="text-sm text-muted-foreground">
            Target your ideal customers based on demographics, interests, and behaviors.
          </p>
        </div>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Audience Insights</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            Demographic analysis
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            Interest mapping
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            Behavior tracking
          </li>
        </ul>
      </div>
    </div>
  );
}
