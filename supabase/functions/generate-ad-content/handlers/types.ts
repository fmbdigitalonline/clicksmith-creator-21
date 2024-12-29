export interface AudienceAnalysisResponse {
  analysis: {
    expandedDefinition: string;
    marketDesire: string;
    awarenessLevel: string;
    sophisticationLevel: string;
    deepPainPoints: string[];
    potentialObjections: string[];
  };
}