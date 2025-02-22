
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IndexFooterProps {
  className?: string;
}

const IndexFooter = ({ className }: IndexFooterProps) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubscribing(true);

    try {
      const { error } = await supabase.functions.invoke("handle-submissions", {
        body: JSON.stringify({
          type: "newsletter",
          email: email
        }),
      });

      if (error) throw error;

      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const links = {
    company: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" }
    ],
    resources: [
      { label: "Blog", to: "/blog" },
      { label: "Help Center", to: "/help" },
      { label: "Support", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Pricing", to: "/pricing" }
    ],
    share: [
      { label: "Affiliate Program", to: "/affiliate" },
      { label: "Referral Program", to: "/referral" },
      { label: "Share & Earn", to: "/share" }
    ]
  };
  const copyright = `© ${new Date().getFullYear()} Viable. All rights reserved.`;

  return (
    <footer className={cn("py-16 bg-gray-900 text-white", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
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
            <h3 className="text-lg font-semibold mb-4">Share & Earn</h3>
            <ul className="space-y-2">
              {links.share?.map((link, index) => (
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
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 text-white px-4 py-2 rounded-lg w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit"
                disabled={isSubscribing}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg whitespace-nowrap disabled:opacity-50"
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
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
