
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";

const Affiliate = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <div className="container mx-auto px-4 pt-24 flex-grow">
        <h1 className="text-4xl font-bold mb-6">Affiliate Program</h1>
        <p className="mb-4">
          Join our affiliate program and earn commissions by promoting our
          platform.
        </p>
        <p className="mb-4">
          Share your unique referral link with your audience and receive a
          percentage of every sale made through your link.
        </p>
        <h2 className="text-2xl font-semibold mb-4">How it Works:</h2>
        <ol className="list-decimal pl-6 mb-4">
          <li>Sign up for our affiliate program.</li>
          <li>Receive a unique referral link.</li>
          <li>Share the link with your audience.</li>
          <li>Earn commissions on every sale.</li>
        </ol>
        <p>
          <a
            href="#"
            className="text-blue-500 hover:underline"
          >
            Sign up now!
          </a>
        </p>
      </div>
      <IndexFooter />
    </div>
  );
};

export default Affiliate;
