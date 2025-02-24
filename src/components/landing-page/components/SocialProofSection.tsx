
import { Star } from "lucide-react";

interface SocialProofItem {
  quote: string;
  author: string;
  role: string;
}

interface SocialProofSectionProps {
  content: {
    title: string;
    subtitle?: string;
    testimonials: SocialProofItem[];
  };
}

export const SocialProofSection = ({ content }: SocialProofSectionProps) => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="text-xl text-gray-600 text-center mb-12 font-sans">
            {content.subtitle}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.testimonials?.map((item, index) => (
            <div 
              key={index} 
              className="text-center transform hover:scale-105 transition-all duration-200 animate-fade-in bg-white p-6 rounded-lg shadow-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Star className="h-8 w-8 text-primary mx-auto mb-4" />
              <div className="text-lg text-gray-700 mb-4 font-sans italic">"{item.quote}"</div>
              <div className="font-display font-semibold">{item.author}</div>
              <div className="text-sm text-gray-600 font-sans">{item.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
