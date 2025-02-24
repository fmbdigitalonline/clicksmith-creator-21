
interface HeroSectionProps {
  content: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    primaryCta?: {
      text: string;
      description?: string;
    };
  };
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {content.title}
            </h1>
            {content.subtitle && (
              <p className="text-xl text-gray-600 font-sans leading-relaxed">
                {content.subtitle}
              </p>
            )}
            {content.primaryCta && (
              <div className="pt-4">
                <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors">
                  {content.primaryCta.text}
                </button>
                {content.primaryCta.description && (
                  <p className="mt-2 text-sm text-gray-500">{content.primaryCta.description}</p>
                )}
              </div>
            )}
          </div>
          {content.imageUrl && (
            <div className="flex-1 relative h-[400px] w-full">
              <img
                src={content.imageUrl}
                alt="Hero"
                className="rounded-lg object-cover w-full h-full"
                onError={(e) => {
                  console.error('Image failed to load:', content.imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
