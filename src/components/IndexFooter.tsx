
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IndexFooterProps {
  className?: string;
}

const IndexFooter = ({ className }: IndexFooterProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Thank you for subscribing to our newsletter.",
      });
      
      setEmail("");
    } catch (error) {
      console.error('Error submitting newsletter subscription:', error);
      toast({
        title: "Error",
        description: "There was a problem subscribing to the newsletter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const links = {
    company: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Careers", to: "/careers" },
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
      { label: "Share & Earn", to: "/share" },
      { label: "Affiliate", to: "/affiliate" },
      { label: "Referral", to: "/referral" }
    ],
    resources: [
      { label: "Blog", to: "/blog" },
      { label: "Help Center", to: "/" },
      { label: "Support", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Pricing", to: "/pricing" }
    ]
  };
  const copyright = `© ${new Date().getFullYear()} Viable. All rights reserved.`;

  return (
    <footer className={cn("py-16 bg-gray-900 text-white", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {links.company?.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.to}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {links.resources?.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.to}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for updates and exclusive content.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg min-w-0"
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg whitespace-nowrap disabled:opacity-50"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default IndexFooter;
