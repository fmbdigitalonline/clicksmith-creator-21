
interface GettingStartedStepProps {
  userType: string;
}

export function GettingStartedStep({ userType }: GettingStartedStepProps) {
  const getContent = () => {
    switch (userType) {
      case 'business_owner':
        return {
          title: "Ready to Grow Your Business?",
          description: "Start creating compelling ads and landing pages that convert visitors into customers."
        };
      case 'creator':
        return {
          title: "Ready to Create Amazing Content?",
          description: "Start designing engaging posts and ads that grow your audience."
        };
      case 'affiliate':
        return {
          title: "Ready to Boost Your Conversions?",
          description: "Start creating high-converting ads and landing pages for your affiliate offers."
        };
      default:
        return {
          title: "Ready to Get Started?",
          description: "Start creating engaging content that reaches your audience."
        };
    }
  };

  const content = getContent();

  return (
    <div className="space-y-6 mt-4">
      <div className="text-center space-y-2">
        <h3 className="font-medium text-lg">{content.title}</h3>
        <p className="text-sm text-muted-foreground">
          {content.description}
        </p>
      </div>
    </div>
  );
}
