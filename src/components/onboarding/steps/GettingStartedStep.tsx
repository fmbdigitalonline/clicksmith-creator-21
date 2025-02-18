
interface GettingStartedStepProps {
  userType: string;
}

export function GettingStartedStep({ userType }: GettingStartedStepProps) {
  const getContent = () => {
    switch (userType) {
      case 'business_owner':
        return {
          title: "Ready to Grow Your Business?",
          description: "Start creating compelling ads and landing pages that convert visitors into customers.",
          shareMessage: "Share with fellow business owners and earn credits for every referral!"
        };
      case 'creator':
        return {
          title: "Ready to Create Amazing Content?",
          description: "Start designing engaging posts and ads that grow your audience.",
          shareMessage: "Share with your creator network and earn credits for every referral!"
        };
      case 'affiliate':
        return {
          title: "Ready to Boost Your Conversions?",
          description: "Start creating high-converting ads and landing pages for your affiliate offers.",
          shareMessage: "Share with your affiliate network and earn extra credits for every referral!"
        };
      default:
        return {
          title: "Ready to Get Started?",
          description: "Start creating engaging content that reaches your audience.",
          shareMessage: "Share with your network and earn credits for every successful referral!"
        };
    }
  };

  const content = getContent();

  return (
    <div className="space-y-6 mt-4">
      <div className="text-center space-y-4">
        <h3 className="font-medium text-lg">{content.title}</h3>
        <p className="text-sm text-muted-foreground">
          {content.description}
        </p>
        <div className="bg-primary/10 p-4 rounded-lg mt-4">
          <p className="text-sm font-medium text-primary">
            🎁 {content.shareMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
