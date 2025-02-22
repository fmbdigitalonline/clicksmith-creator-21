
import { ScrollArea } from "@/components/ui/scroll-area";
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";

const Terms = () => {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <div className="container mx-auto py-8 px-4 mt-16 flex-grow">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <ScrollArea className="h-[70vh] rounded-md border p-6">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">By accessing and using this website and our services, you accept and agree to be bound by the terms and provisions of this agreement.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground">We provide an AI-powered platform for business idea validation and marketing strategy development ("Service"). The Service includes access to our platform, tools, and features as described on our website.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Account and Credits</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">New users receive 12 free credits upon registration. Credits are non-transferable and expire after 30 days from the date of issuance.</p>
                  <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account information and password.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Subscription and Billing</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">After using your free credits, you may purchase additional credits or subscribe to our paid plans.</p>
                  <p className="text-muted-foreground">All fees are exclusive of taxes, which you are responsible for paying.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Intellectual Property Rights</h2>
                <p className="text-muted-foreground">The Service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. User Content</h2>
                <p className="text-muted-foreground">You retain all rights to any content you submit, post or display on or through the Service. By submitting content, you grant us a worldwide, non-exclusive license to use, reproduce, and distribute such content.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
                <p className="text-muted-foreground">We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties, or for any other reason.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-muted-foreground">In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages, arising out of or in connection with your use of the Service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
                <p className="text-muted-foreground">We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
                <p className="text-muted-foreground">If you have any questions about these Terms, please contact us at info@fmbonline.com</p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
      <IndexFooter />
    </div>
  );
};

export default Terms;
