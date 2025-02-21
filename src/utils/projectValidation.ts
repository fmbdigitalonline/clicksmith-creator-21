
import { Project } from "@/types/adWizard";
import { ProjectState, ProjectStatus } from "@/types/projectStatus";

export const validateProjectState = (project: Project): ProjectStatus => {
  const hasGeneratedAds = project.generated_ads?.length > 0;
  const hasBusinessIdea = !!project.business_idea;
  const hasTargetAudience = !!project.target_audience;
  const hasAudienceAnalysis = !!project.audience_analysis;
  const hasSelectedHooks = !!project.selected_hooks;

  let state: ProjectState = 'not_started';
  let completedSteps = 0;

  // Calculate completed steps
  if (hasBusinessIdea) completedSteps++;
  if (hasTargetAudience) completedSteps++;
  if (hasAudienceAnalysis) completedSteps++;
  if (hasSelectedHooks) completedSteps++;

  // Determine state
  if (hasGeneratedAds && project.current_step === 4) {
    state = 'ads_generated';
  } else if (hasGeneratedAds && project.current_step < 4) {
    state = 'needs_regeneration';
  } else if (completedSteps > 0) {
    state = 'in_progress';
  }

  const hasValidAds = hasGeneratedAds && project.current_step === 4;

  return {
    state,
    completedSteps,
    hasValidAds,
    lastUpdated: new Date(project.updated_at)
  };
};

export const getProjectStateText = (state: ProjectState): string => {
  switch (state) {
    case 'ads_generated':
      return 'Ads Generated';
    case 'in_progress':
      return 'In Progress';
    case 'needs_regeneration':
      return 'Needs Regeneration';
    default:
      return 'Not Started';
  }
};
