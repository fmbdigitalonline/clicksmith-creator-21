
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface IndexFooterProps {
  className?: string;
}

const IndexFooter = ({ className }: IndexFooterProps) => {
  const links = {
    company: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Careers", to: "/careers" },
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
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 text-white px-4 py-2 rounded-lg flex-1"
              />
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg">
                Subscribe
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
