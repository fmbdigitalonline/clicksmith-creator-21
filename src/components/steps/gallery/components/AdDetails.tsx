interface AdDetailsProps {
  variant: {
    headline: string;
    description: string;
    specs?: {
      designRecommendations?: {
        fileTypes: string[];
        aspectRatios: string;
      };
      textRecommendations?: {
        primaryTextLength: string;
        headlineLength: string;
      };
    };
  };
  isVideo: boolean;
}

const AdDetails = ({ variant, isVideo }: AdDetailsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-600">Primary Text:</p>
      <p className="text-gray-800">{variant.description}</p>
      <p className="text-sm font-medium text-gray-600">Headline:</p>
      <h3 className="text-lg font-semibold text-facebook">
        {variant.headline}
      </h3>
      {variant.specs && (
        <div className="mt-4 space-y-2">
          {variant.specs.designRecommendations && (
            <div>
              <p className="text-sm font-medium text-gray-600">Design Recommendations:</p>
              <p className="text-gray-700">File Types: {variant.specs.designRecommendations.fileTypes.join(', ')}</p>
              <p className="text-gray-700">Aspect Ratios: {variant.specs.designRecommendations.aspectRatios}</p>
            </div>
          )}
          {variant.specs.textRecommendations && (
            <div>
              <p className="text-sm font-medium text-gray-600">Text Recommendations:</p>
              <p className="text-gray-700">Primary Text: {variant.specs.textRecommendations.primaryTextLength}</p>
              <p className="text-gray-700">Headline: {variant.specs.textRecommendations.headlineLength}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdDetails;