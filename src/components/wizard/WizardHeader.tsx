interface WizardHeaderProps {
  title: string;
  description: string;
}

const WizardHeader = ({ title, description }: WizardHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default WizardHeader;