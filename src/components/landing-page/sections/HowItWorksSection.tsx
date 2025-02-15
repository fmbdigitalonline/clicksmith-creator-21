
import { cn } from "@/lib/utils";

interface HowItWorksSectionProps {
  content?: {
    subheadline?: string;
    steps?: Array<{
      title: string;
      description: string;
    }>;
    valueReinforcement?: string;
  };
  className?: string;
}

const HowItWorksSection = ({ content, className }: HowItWorksSectionProps) => {
  if (!content) return null;

  return (
    <section className={cn("py-16 bg-background", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        {content.subheadline && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {content.subheadline}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {content.steps?.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        {content.valueReinforcement && (
          <div className="text-center">
            <p className="text-lg font-medium">✨ {content.valueReinforcement}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HowItWorksSection;
