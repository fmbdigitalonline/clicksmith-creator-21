
import { Star } from "lucide-react";

interface SocialProofItem {
  title: string;
  description: string;
}

interface SocialProofSectionProps {
  content: {
    title: string;
    items: SocialProofItem[];
  };
}

export const SocialProofSection = ({ content }: SocialProofSectionProps) => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.items.map((item, index) => (
            <div 
              key={index} 
              className="text-center transform hover:scale-105 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Star className="h-8 w-8 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">{item.title}</div>
              <div className="text-gray-600">{item.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
