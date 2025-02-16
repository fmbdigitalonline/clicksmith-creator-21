
import { cn } from "@/lib/utils";

interface ValuePropositionSectionProps {
  content: {
    title: string;
    cards?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
  className?: string;
}

const ValuePropositionSection = ({ content, className }: ValuePropositionSectionProps) => {
  const items = content?.cards || [];
  
  return (
    <section className={cn("py-16 bg-background border border-gray-100 rounded-lg", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>
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
