import { AdFormat, TargetAudience } from "@/types/adWizard";

interface AdDetailsProps {
  adFormat: AdFormat;
  targetAudience: TargetAudience;
}

const AdDetails = ({ adFormat, targetAudience }: AdDetailsProps) => {
  return (
    <div>
      <h4 className="font-medium mb-4 text-gray-900">Ad Details</h4>
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Format</h5>
          <p className="text-sm text-gray-600">
            {adFormat.format} ({adFormat.dimensions.width} x {adFormat.dimensions.height}px)
          </p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Target Audience</h5>
          <p className="text-sm text-gray-600">{targetAudience.name}</p>
          <p className="text-sm text-gray-600 mt-1">{targetAudience.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AdDetails;