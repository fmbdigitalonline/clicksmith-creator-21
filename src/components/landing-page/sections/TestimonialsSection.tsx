
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  content: {
    title: string;
    items: Array<{
      quote: string;
      author: string;
      role: string;
    }>;
  };
  className?: string;
}

const TestimonialsSection = ({ content, className }: TestimonialsSectionProps) => {
  return (
    <section className={cn("py-16", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.items.map((testimonial, index) => (
            <div key={index} className="bg-card p-6 rounded-lg shadow-sm">
              <blockquote className="text-muted-foreground mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div>
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
