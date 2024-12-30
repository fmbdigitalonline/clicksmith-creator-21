interface AdPreviewDetailsProps {
  variant: {
    headline: string;
    description: string;
    callToAction: string;
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
  selectedSize: {
    width: number;
    height: number;
    label?: string;
  };
  isVideo: boolean;
}

const AdPreviewDetails = ({ variant, selectedSize, isVideo }: AdPreviewDetailsProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">{variant.headline}</h3>
        <span className="text-sm text-gray-500">{selectedSize.label || `${selectedSize.width}x${selectedSize.height}`}</span>
      </div>
      <p className="text-gray-600">{variant.description}</p>
      <p className="text-facebook font-medium">{variant.callToAction}</p>
      <div className="text-sm text-gray-500 space-y-1">
        <p>Size: {selectedSize.width}x{selectedSize.height}</p>
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

export default AdPreviewDetails;