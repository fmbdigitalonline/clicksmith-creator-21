export const PricingFAQ = () => {
  return (
    <div className="mt-16 text-center">
      <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
        <div>
          <h3 className="font-medium mb-2">What are credits?</h3>
          <p className="text-muted-foreground">Credits are used to generate AI-powered content and ads. Each generation consumes one credit. Monthly credits are refreshed at the start of each billing cycle.</p>
        </div>
        <div>
          <h3 className="font-medium mb-2">Can I change plans?</h3>
          <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
        </div>
        <div>
          <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
          <p className="text-muted-foreground">We accept all major credit cards and debit cards. Payments are processed securely through Stripe.</p>
        </div>
        <div>
          <h3 className="font-medium mb-2">Is there a free trial?</h3>
          <p className="text-muted-foreground">Yes! All new users get 12 free generations to try out our platform before subscribing to a paid plan.</p>
        </div>
      </div>
    </div>
  );
};