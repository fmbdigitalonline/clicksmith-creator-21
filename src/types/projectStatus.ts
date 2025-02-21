
export type ProjectState = 'not_started' | 'in_progress' | 'ads_generated' | 'needs_regeneration';

export interface ProjectStatus {
  state: ProjectState;
  completedSteps: number;
  hasValidAds: boolean;
  lastUpdated: Date;
}
