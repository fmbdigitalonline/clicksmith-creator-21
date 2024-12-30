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
    <div className="space-y-2 mt-4 text-sm text-muted-foreground">
      {businessIdea && (
        <div>
          <strong>Business Idea:</strong> {businessIdea.description}
        </div>
      )}
      {targetAudience && (
        <div>
          <strong>Target Audience:</strong> {JSON.stringify(targetAudience)}
        </div>
      )}
      {audienceAnalysis && (
        <div>
          <strong>Audience Analysis:</strong> {JSON.stringify(audienceAnalysis)}
        </div>
      )}
    </div>
  );
};

export default ProjectProgressDetails;