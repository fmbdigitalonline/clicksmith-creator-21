
import { cn } from "@/lib/utils";

interface Card {
  title: string;
  description: string;
  icon?: string;
}

interface ValuePropositionSectionProps {
  content: {
    title?: string;
    description?: string;
    cards?: Array<Card>;
  };
  className?: string;
}

const ValuePropositionSection = ({ content, className }: ValuePropositionSectionProps) => {
  if (!content) return null;

  const items = content.cards || [];
  
  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-4">{content.title}</h2>
        )}
        {content.description && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {content.description}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              {item.icon && (
                <div className="text-2xl mb-4">{item.icon}</div>
              )}
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
