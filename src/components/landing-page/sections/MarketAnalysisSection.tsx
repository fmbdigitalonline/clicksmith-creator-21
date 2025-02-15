
import { cn } from "@/lib/utils";

interface MarketAnalysisSectionProps {
  content?: {
    context?: string;
    solution?: string;
    painPoints?: Array<{
      title: string;
      description: string;
    }>;
    features?: Array<{
      title: string;
      description: string;
    }>;
    socialProof?: {
      quote: string;
      author: string;
      title: string;
    };
  };
  className?: string;
}

const MarketAnalysisSection = ({ content, className }: MarketAnalysisSectionProps) => {
  if (!content) return null;

  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-6">Why You Need This Product</h2>
          {content.context && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Market Analysis: Understanding the Market Situation</h3>
              <p className="text-muted-foreground">{content.context}</p>
            </div>
          )}
          {content.solution && (
            <div className="mb-8">
              <p className="text-muted-foreground">{content.solution}</p>
            </div>
          )}
        </div>

        {Array.isArray(content.painPoints) && content.painPoints.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-center mb-8">Deep Pain Points: Solving Your Biggest Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.painPoints.map((point, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-semibold mb-2">{point.title}</h4>
                  <p className="text-muted-foreground">{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(content.features) && content.features.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-center mb-8">Why Our Solution Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.features.map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.socialProof && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <p className="text-lg italic mb-4">💬 "{content.socialProof.quote}"</p>
              <p className="font-semibold">{content.socialProof.author}</p>
              <p className="text-muted-foreground">{content.socialProof.title}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketAnalysisSection;
