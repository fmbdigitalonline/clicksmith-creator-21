interface HeaderProps {
  title: string;
  description: string;
}

const Header = ({ title, description }: HeaderProps) => {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Header;