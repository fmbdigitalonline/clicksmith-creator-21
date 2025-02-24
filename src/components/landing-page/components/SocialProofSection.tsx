
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSettings } from "@/types/landingPage";

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
  theme?: ThemeSettings;
}

export const SocialProofSection = ({ content, theme }: SocialProofSectionProps) => {
  return (
    <section className={cn(
      "py-16",
      theme?.colorScheme?.background ? `bg-${theme.colorScheme.background}` : "bg-white"
    )}>
      <div className="container mx-auto px-4">
        <h2 className={cn(
          "text-3xl font-bold text-center mb-4",
          theme?.typography?.scale?.h2,
          theme?.colorScheme?.text && `text-${theme.colorScheme.text}`
        )}>
          {content.title}
        </h2>
        {content.subtitle && (
          <p className={cn(
            "text-xl text-gray-600 text-center mb-12",
            theme?.typography?.scale?.h3,
            theme?.colorScheme?.muted && `text-${theme.colorScheme.muted}`
          )}>
            {content.subtitle}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.testimonials?.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "text-center transform hover:scale-105 transition-all duration-200 animate-fade-in",
                theme?.style?.shadowStrength === 'strong' && "shadow-2xl",
                theme?.style?.shadowStrength === 'medium' && "shadow-xl",
                theme?.style?.shadowStrength === 'light' && "shadow-md",
                theme?.style?.borderRadius && `rounded-${theme.style.borderRadius}`,
                "p-6"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Star className={cn(
                "h-8 w-8 mx-auto mb-4",
                theme?.colorScheme?.primary ? `text-${theme.colorScheme.primary}` : "text-primary"
              )} />
              <div className={cn(
                "text-lg mb-4",
                theme?.colorScheme?.text ? `text-${theme.colorScheme.text}` : "text-gray-700"
              )}>
                "{item.quote}"
              </div>
              <div className={cn(
                "font-semibold",
                theme?.colorScheme?.text && `text-${theme.colorScheme.text}`
              )}>
                {item.author}
              </div>
              <div className={cn(
                "text-sm",
                theme?.colorScheme?.muted ? `text-${theme.colorScheme.muted}` : "text-gray-600"
              )}>
                {item.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
