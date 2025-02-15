
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  content?: {
    title?: string;
    items?: Array<{
      quote: string;
      author: string;
      role: string;
    }>;
  };
  className?: string;
}

const TestimonialsSection = ({ content, className }: TestimonialsSectionProps) => {
  const items = content?.items || [];
  const title = content?.title || "What Our Clients Say";

  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
          {items.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 relative">
              <div className="text-gray-200 text-6xl absolute -top-4 left-4">"</div>
              <blockquote className="text-muted-foreground mb-4 relative z-10 pl-4">
                {testimonial.quote}
              </blockquote>
              <div className="pl-4">
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
