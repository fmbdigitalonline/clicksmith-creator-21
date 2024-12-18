export interface FacebookAdSpecs {
  imageAds: {
    designRecommendations: {
      fileTypes: string[];
      aspectRatios: string;
      recommendedResolutions: {
        [key: string]: string;
      };
    };
    textRecommendations: {
      primaryTextLength: string;
      headlineLength: string;
    };
    technicalRequirements: {
      maxFileSizeMB: number;
      minWidth: number;
      minHeight: {
        [key: string]: number;
      };
      aspectRatioMargin: string;
    };
  };
}

export const facebookAdSpecs: FacebookAdSpecs = {
  imageAds: {
    designRecommendations: {
      fileTypes: ["JPG", "PNG"],
      aspectRatios: "1.91:1 to 4:5",
      recommendedResolutions: {
        "1:1": "1440 x 1440 px",
        "4:5": "1440 x 1800 px"
      }
    },
    textRecommendations: {
      primaryTextLength: "50-150 characters",
      headlineLength: "27 characters"
    },
    technicalRequirements: {
      maxFileSizeMB: 30,
      minWidth: 600,
      minHeight: {
        "1:1": 600,
        "4:5": 750
      },
      aspectRatioMargin: "3%"
    }
  }
};