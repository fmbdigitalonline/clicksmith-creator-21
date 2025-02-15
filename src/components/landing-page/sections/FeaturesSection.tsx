
interface FeaturesSectionProps {
  content?: {
    title?: string;
    description?: string;
    items?: Array<{
      title: string;
      description: string;
    }>;
  };
  className?: string;
}

const FeaturesSection = ({ content, className }: FeaturesSectionProps) => {
  if (!content) return null;

  return (
    <section className={className}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
          {typeof content.description === 'string' && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
          )}
        </div>

        {Array.isArray(content.items) && content.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.items.map((item, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturesSection;
