
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FooterSectionProps {
  content?: {
    contact?: string;
    newsletter?: string;
    copyright?: string;
  };
  className?: string;
}

const FooterSection = ({ content, className }: FooterSectionProps) => {
  if (!content) return null;

  return (
    <footer className={cn("py-16 bg-muted", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
          {content.contact && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-muted-foreground">{content.contact}</p>
            </div>
          )}
          
          {content.newsletter && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
              <p className="text-muted-foreground mb-4">{content.newsletter}</p>
              <div className="flex gap-2">
                <Input type="email" placeholder="Enter your email" />
                <Button>Subscribe</Button>
              </div>
            </div>
          )}
        </div>

        {content.copyright && (
          <div className="text-center text-muted-foreground text-sm border-t border-border pt-8">
            {content.copyright}
          </div>
        )}
      </div>
    </footer>
  );
};

export default FooterSection;
