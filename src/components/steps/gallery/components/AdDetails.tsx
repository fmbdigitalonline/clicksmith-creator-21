interface AdDetailsProps {
  variant: {
    headline: string;
    description: string;
    callToAction: string;
    size: {
      width: number;
      height: number;
      label: string;
    };
    specs?: {
      designRecommendations?: {
        fileTypes: string[];
        aspectRatios: string;
      };
    };
  };
  isVideo?: boolean;
}

const AdDetails = ({ variant, isVideo = false }: AdDetailsProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">{variant.headline}</h3>
        <span className="text-sm text-gray-500">{variant.size.label}</span>
      </div>
      <p className="text-gray-600">{variant.description}</p>
      <p className="text-facebook font-medium">{variant.callToAction}</p>
      <div className="text-sm text-gray-500 space-y-1">
        <p>Size: {variant.size.width}x{variant.size.height}</p>
        {variant.specs?.designRecommendations && (
          <>
            <p>Format: {variant.specs.designRecommendations.fileTypes.join(", ")}</p>
            <p>Aspect Ratio: {variant.specs.designRecommendations.aspectRatios}</p>
          </>
        )}
        {isVideo && (
          <p>Type: Video Ad</p>
        )}
      </div>
    </div>
  );
};

export default AdDetails;