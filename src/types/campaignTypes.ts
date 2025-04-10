
// Adding FacebookAdSettings interface - make sure this file exists and is properly importing/exporting if it already exists
export interface FacebookAdSettings {
  website_url: string;
  visible_link: string;
  call_to_action: string;
  ad_language: string;
  url_parameters?: string;
  browser_addon?: string;
}
