
import { Card } from "@/components/ui/card";

interface AdDetailsProps {
  headline: string;
  description: string;
  callToAction: string;
  platform: string;
}

const AdDetails = ({ headline, description, callToAction, platform }: AdDetailsProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-500">Headline</p>
          <h3 className="font-semibold text-gray-900">{headline}</h3>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="text-gray-700">{description}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Call to Action</p>
          <p className="text-blue-600 font-medium">{callToAction}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Platform</p>
          <p className="text-gray-700">{platform}</p>
        </div>
      </div>
    </Card>
  );
};

export default AdDetails;
