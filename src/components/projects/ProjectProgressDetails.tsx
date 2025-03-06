
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
  BarChart3,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { validateBusinessIdea, validateTargetAudience, validateAudienceAnalysis } from "@/utils/dataValidationUtils";

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

  // Validate each section
  const businessValidation = validateBusinessIdea(businessIdea);
  const audienceValidation = validateTargetAudience(targetAudience);
  const analysisValidation = validateAudienceAnalysis(audienceAnalysis);

  const renderCardHeader = (icon: React.ReactNode, title: string, gradientClasses: string, isComplete: boolean) => (
    <div className={`${gradientClasses} p-4 border-b`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
        </div>
        {isComplete ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Complete
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Incomplete
          </Badge>
        )}
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
  
  const renderMissingFields = (missingFields: string[]) => {
    if (missingFields.length === 0) return null;
    
    return (
      <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-100">
        <p className="text-sm font-medium text-amber-800 mb-1">Missing information:</p>
        <ul className="list-disc pl-5 text-sm text-amber-700">
          {missingFields.map((field, index) => (
            <li key={index}>{field}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {businessIdea && (
        <Card className="overflow-hidden border-facebook/10 shadow-sm hover:shadow-md transition-shadow">
          {renderCardHeader(
            <Lightbulb className="w-5 h-5 text-facebook" />,
            "Business Concept",
            "bg-gradient-to-r from-facebook/10 to-facebook/5",
            businessValidation.isComplete
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
            {renderMissingFields(businessValidation.missingFields)}
          </div>
        </Card>
      )}

      {targetAudience && (
        <Card className="overflow-hidden border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          {renderCardHeader(
            <Users className="w-5 h-5 text-purple-600" />,
            "Target Audience",
            "bg-gradient-to-r from-purple-100 to-purple-50",
            audienceValidation.isComplete
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
            {renderMissingFields(audienceValidation.missingFields)}
          </div>
        </Card>
      )}

      {audienceAnalysis && (
        <Card className="overflow-hidden border-green-200 shadow-sm hover:shadow-md transition-shadow">
          {renderCardHeader(
            <BarChart3 className="w-5 h-5 text-green-600" />,
            "Market Analysis",
            "bg-gradient-to-r from-green-100 to-green-50",
            analysisValidation.isComplete
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
            {renderMissingFields(analysisValidation.missingFields)}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectProgressDetails;
