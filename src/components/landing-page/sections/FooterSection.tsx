
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Contact {
  email?: string;
  phone?: string;
  address?: string;
}

interface FooterSectionProps {
  content?: {
    contact?: string | Contact;
    newsletter?: string;
    copyright?: string;
  };
  className?: string;
}

const FooterSection = ({ content, className }: FooterSectionProps) => {
  if (!content) return null;

  const renderContact = (contact: string | Contact) => {
    if (typeof contact === 'string') {
      return <p className="text-muted-foreground">{contact}</p>;
    }

    return (
      <div className="space-y-2">
        {contact.email && (
          <p className="text-muted-foreground">Email: {contact.email}</p>
        )}
        {contact.phone && (
          <p className="text-muted-foreground">Phone: {contact.phone}</p>
        )}
        {contact.address && (
          <p className="text-muted-foreground">Address: {contact.address}</p>
        )}
      </div>
    );
  };

  return (
    <footer className={cn("py-16 bg-background border-t border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
          {content.contact && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              {renderContact(content.contact)}
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
          <div className="text-center text-muted-foreground text-sm border-t border-gray-100 pt-8">
            {content.copyright}
          </div>
        )}
      </div>
    </footer>
  );
};

export default FooterSection;
