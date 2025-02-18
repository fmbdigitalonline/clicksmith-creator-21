
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { BookOpen, Star, Users, UsersRound, DollarSign, Share2, MessageSquare } from "lucide-react";

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          {content.contact && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              {renderContact(content.contact)}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <div className="space-y-3">
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/faq" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Getting Started
                </Link>
              </Button>
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/faq" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  FAQs and Support
                </Link>
              </Button>
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/contact" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Help Us Improve</h3>
            <div className="space-y-3">
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/contact" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Share Your Feedback
                </Link>
              </Button>
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <a href="https://trustpilot.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rate Us on Trustpilot
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Share & Earn</h3>
            <div className="space-y-3">
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/referral" className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4" />
                  Refer a Friend
                </Link>
              </Button>
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/affiliate" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Affiliate Program
                </Link>
              </Button>
              <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-primary">
                <Link to="/share" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share on Social Media
                </Link>
              </Button>
            </div>
          </div>
          
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
