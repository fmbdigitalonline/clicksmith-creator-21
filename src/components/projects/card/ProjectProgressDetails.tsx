
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Users, 
  ChartBar, 
  Target, 
  MessageCircle, 
  DollarSign,
  Puzzle,
  HeartHandshake,
  BarChart3
} from "lucide-react";

interface ProjectProgressDetailsProps {
  businessIdea?: {
    description: string;
    valueProposition: string;
  };
  targetAudience?: any;
  audienceAnalysis?: any;
}

const ProjectProgressDetails = ({ 
  businessIdea, 
  targetAudience, 
  audienceAnalysis 
}: ProjectProgressDetailsProps) => {
  if (!businessIdea && !targetAudience && !audienceAnalysis) return null;

  return (
    <div className="space-y-6">
      {businessIdea && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-facebook/10 to-facebook/5 p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-facebook" />
              <h3 className="font-semibold text-lg">Business Concept</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Puzzle className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Business Description</p>
                <p className="text-gray-600">{businessIdea.description}</p>
              </div>
            </div>
            {businessIdea.valueProposition && (
              <div className="flex items-start gap-3">
                <HeartHandshake className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Value Proposition</p>
                  <p className="text-gray-600">{businessIdea.valueProposition}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {targetAudience && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-lg">Target Audience</h3>
            </div>
          </div>
          <div className="p-6 grid gap-4 md:grid-cols-2">
            {Object.entries(targetAudience).map(([key, value]) => (
              key !== 'audienceAnalysis' && (
                <div key={key} className="flex items-start gap-3">
                  {key === 'demographics' && <Target className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                  {key === 'painPoints' && <MessageCircle className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                  {key === 'icp' && <Users className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                  {key === 'coreMessage' && <MessageCircle className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                  {key === 'name' && <Users className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                  {key === 'description' && <MessageCircle className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-gray-700 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-gray-600">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>
      )}

      {audienceAnalysis && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-lg">Market Analysis</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {Object.entries(audienceAnalysis).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Badge 
                  variant="outline" 
                  className="mb-2 px-3 py-1 text-sm font-medium"
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-2">
                      {(value as string[]).map((item, index) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700">{String(value)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectProgressDetails;
