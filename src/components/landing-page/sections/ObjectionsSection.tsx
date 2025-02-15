
import { cn } from "@/lib/utils";

interface ObjectionsSectionProps {
  content?: {
    subheadline?: string;
    concerns?: Array<{
      question: string;
      answer: string;
    }>;
  };
  className?: string;
}

const ObjectionsSection = ({ content, className }: ObjectionsSectionProps) => {
  if (!content) return null;

  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Addressing Potential Objections</h2>
        {content.subheadline && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {content.subheadline}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {content.concerns?.map((concern, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-2">{concern.question}</h3>
              <p className="text-muted-foreground">{concern.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObjectionsSection;
