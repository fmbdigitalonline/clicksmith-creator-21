
interface WizardHeaderProps {
  title: string;
  description: string;
}

const WizardHeader = ({ title, description }: WizardHeaderProps) => {
  return (
    <div className="mb-4 flex items-center gap-4">
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
      <p className="text-sm text-gray-600 hidden md:block">{description}</p>
    </div>
  );
};

export default WizardHeader;
