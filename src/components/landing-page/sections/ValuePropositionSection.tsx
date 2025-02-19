
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
    <section className={cn("py-24 bg-white", className)}>
      <div className="container mx-auto px-4">
        {content.title && (
          <h2 className="text-4xl font-bold text-center mb-6">{content.title}</h2>
        )}
        {content.description && (
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            {content.description}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              {item.icon && (
                <div className="text-3xl mb-6">{item.icon}</div>
              )}
              <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
