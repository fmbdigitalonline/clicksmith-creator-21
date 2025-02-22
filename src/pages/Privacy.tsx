
import { ScrollArea } from "@/components/ui/scroll-area";
import Navigation from "@/components/Navigation";

const Privacy = () => {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <div className="container mx-auto py-8 px-4 mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <ScrollArea className="h-[70vh] rounded-md border p-6">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">We collect information that you provide directly to us, including:</p>
                  <ul className="list-disc pl-6 text-muted-foreground">
                    <li>Account information (name, email, password)</li>
                    <li>Business information you input for validation</li>
                    <li>Payment information when you purchase credits or subscriptions</li>
                    <li>Communications you have with us</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">We use the information we collect to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process your transactions</li>
                    <li>Send you technical notices and support messages</li>
                    <li>Communicate with you about products, services, and events</li>
                    <li>Respond to your comments and questions</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-muted-foreground">We do not sell or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our service, conducting our business, or servicing you.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                <p className="text-muted-foreground">We implement appropriate technical and organizational measures to maintain the security of your personal information, including encryption of sensitive data and regular security assessments.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">You have the right to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Request deletion of your information</li>
                    <li>Object to processing of your information</li>
                    <li>Request restriction of processing</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
                <p className="text-muted-foreground">We use cookies and similar tracking technologies to collect information about your browsing activities and to maintain your user session and preferences.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Marketing Communications</h2>
                <p className="text-muted-foreground">You can opt out of receiving marketing communications from us by following the unsubscribe instructions included in our emails or contacting us.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Changes to Privacy Policy</h2>
                <p className="text-muted-foreground">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
                <p className="text-muted-foreground">If you have any questions about this Privacy Policy, please contact us at info@fmbonline.com</p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
