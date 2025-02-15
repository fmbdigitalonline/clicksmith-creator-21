
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

  const renderCardHeader = (icon: React.ReactNode, title: string, gradientClasses: string) => (
    <div className={`${gradientClasses} p-4 border-b`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
      </div>
    </div>
  );

  const renderInfoItem = (icon: React.ReactNode, title: string, content: string | string[]) => (
    <div className="flex items-start gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
        <p className="text-gray-600 leading-relaxed">
          {Array.isArray(content) ? content.join(', ') : content}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {businessIdea && (
        <Card className="overflow-hidden border-facebook/10 shadow-sm hover:shadow-md transition-shadow">
          {renderCardHeader(
            <Lightbulb className="w-5 h-5 text-facebook" />,
            "Business Concept",
            "bg-gradient-to-r from-facebook/10 to-facebook/5"
          )}
          <div className="p-6 space-y-6">
            {renderInfoItem(
              <Puzzle className="w-4 h-4 text-facebook/70 mt-1 flex-shrink-0" />,
              "Business Description",
              businessIdea.description
            )}
            {businessIdea.valueProposition && renderInfoItem(
              <HeartHandshake className="w-4 h-4 text-facebook/70 mt-1 flex-shrink-0" />,
              "Value Proposition",
              businessIdea.valueProposition
            )}
          </div>
        </Card>
      )}

      {targetAudience && (
        <Card className="overflow-hidden border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          {renderCardHeader(
            <Users className="w-5 h-5 text-purple-600" />,
            "Target Audience",
            "bg-gradient-to-r from-purple-100 to-purple-50"
          )}
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(targetAudience).map(([key, value]) => (
                key !== 'audienceAnalysis' && (
                  <div key={key} className="bg-purple-50/50 rounded-lg p-4">
                    {renderInfoItem(
                      key === 'demographics' ? <Target className="w-4 h-4 text-purple-500/70 mt-1 flex-shrink-0" /> :
                      key === 'painPoints' ? <MessageCircle className="w-4 h-4 text-purple-500/70 mt-1 flex-shrink-0" /> :
                      key === 'icp' ? <Users className="w-4 h-4 text-purple-500/70 mt-1 flex-shrink-0" /> :
                      <MessageCircle className="w-4 h-4 text-purple-500/70 mt-1 flex-shrink-0" />,
                      key.replace(/([A-Z])/g, ' $1').trim(),
                      value as string | string[]
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        </Card>
      )}

      {audienceAnalysis && (
        <Card className="overflow-hidden border-green-200 shadow-sm hover:shadow-md transition-shadow">
          {renderCardHeader(
            <BarChart3 className="w-5 h-5 text-green-600" />,
            "Market Analysis",
            "bg-gradient-to-r from-green-100 to-green-50"
          )}
          <div className="p-6 space-y-6">
            {Object.entries(audienceAnalysis).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <Badge 
                  variant="outline" 
                  className="px-3 py-1 text-sm font-medium border-green-200 text-green-700"
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
                <div className="bg-green-50/50 rounded-lg p-4">
                  {Array.isArray(value) ? (
                    <ul className="space-y-2">
                      {(value as string[]).map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <span className="text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{String(value)}</p>
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
