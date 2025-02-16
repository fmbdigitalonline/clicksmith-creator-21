
interface AudienceStepProps {
  userType: string;
}

export function AudienceStep({ userType }: AudienceStepProps) {
  const getTitle = () => {
    switch (userType) {
      case 'business_owner':
        return 'Reach Your Ideal Customers';
      case 'creator':
        return 'Grow Your Following';
      case 'affiliate':
        return 'Find High-Converting Audiences';
      default:
        return 'Connect with Your Audience';
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">{getTitle()}</h3>
        <p className="text-sm text-muted-foreground">
          Our AI-powered targeting helps you:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            • Identify your ideal audience demographics
          </li>
          <li className="flex items-center">
            • Target based on interests and behaviors
          </li>
          <li className="flex items-center">
            • Optimize your reach and engagement
          </li>
          <li className="flex items-center">
            • Track and improve performance
          </li>
        </ul>
      </div>
    </div>
  );
}
