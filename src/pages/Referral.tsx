
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";

const Referral = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <div className="container mx-auto px-4 pt-24 flex-grow">
        <h1 className="text-4xl font-bold mb-6">Referral Program</h1>
        <p className="text-gray-600 mb-4">
          Refer friends and earn rewards! Share your unique referral link to get started.
        </p>
        <div className="mb-4">
          <label htmlFor="referralLink" className="block text-sm font-medium text-gray-700">
            Your Referral Link:
          </label>
          <div className="mt-1 rounded-md shadow-sm">
            <input
              type="text"
              name="referralLink"
              id="referralLink"
              className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              value="https://yourapp.com/referral/unique-code"
              readOnly
            />
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Copy Referral Link
        </button>
      </div>
      <IndexFooter />
    </div>
  );
};

export default Referral;
