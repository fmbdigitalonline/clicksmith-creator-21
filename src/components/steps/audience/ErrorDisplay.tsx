interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <p className="font-medium">Error occurred:</p>
      <p>{message}</p>
      <p className="text-sm mt-2">Please try again or contact support if the issue persists.</p>
    </div>
  );
};

export default ErrorDisplay;