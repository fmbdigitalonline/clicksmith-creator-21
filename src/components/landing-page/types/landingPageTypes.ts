
export interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

export interface SectionContent {
  content: {
    title?: string;
    description?: string;
    cta?: string;
    image?: string;
    cards?: any[];
    items?: any[];
    [key: string]: any;
  };
  layout: string;
  theme?: any;
}

export interface SectionContentMap {
  hero?: SectionContent;
  value_proposition?: SectionContent;
  features?: SectionContent;
  proof?: SectionContent;
  pricing?: SectionContent;
  finalCta?: SectionContent;
  footer?: SectionContent;
  [key: string]: SectionContent | undefined;
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}

export interface GenerationLog {
  id: string;
  project_id: string;
  user_id: string;
  api_status_code: number;
  cache_hit: boolean;
  error_message: string | null;
  generation_time: number;
  success: boolean;
  status: string;
  step_details: {
    stage?: string;
    timestamp?: string;
    [key: string]: any;
  } | null;
  request_payload: any;
  response_payload: any;
  created_at: string;
  updated_at?: string;
}
