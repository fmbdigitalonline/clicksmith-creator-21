
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ValidationResult } from "@/utils/dataValidationUtils";

interface DataCompletionWarningProps {
  validation: ValidationResult;
  completenessPercentage: number;
  showDetails?: boolean;
}

const DataCompletionWarning = ({ 
  validation, 
  completenessPercentage,
  showDetails = false 
}: DataCompletionWarningProps) => {
  if (validation.isComplete) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-4">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Data Complete</AlertTitle>
        <AlertDescription className="text-green-700">
          All required project information is available for campaign creation.
        </AlertDescription>
      </Alert>
    );
  }

  const getAlertStyle = () => {
    if (completenessPercentage < 50) {
      return "bg-red-50 border-red-200";
    } else if (completenessPercentage < 80) {
      return "bg-yellow-50 border-yellow-200";
    } else {
      return "bg-blue-50 border-blue-200";
    }
  };

  const getTextStyle = () => {
    if (completenessPercentage < 50) {
      return { title: "text-red-800", description: "text-red-700" };
    } else if (completenessPercentage < 80) {
      return { title: "text-yellow-800", description: "text-yellow-700" };
    } else {
      return { title: "text-blue-800", description: "text-blue-700" };
    }
  };

  const getIcon = () => {
    if (completenessPercentage < 50) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <Info className="h-4 w-4 text-yellow-600" />;
    }
  };

  const textStyle = getTextStyle();

  return (
    <Alert className={`${getAlertStyle()} mb-4`}>
      {getIcon()}
      <AlertTitle className={textStyle.title}>
        {completenessPercentage < 50 ? "Incomplete Data" : "Data Improvement Needed"}
      </AlertTitle>
      <AlertDescription className={textStyle.description}>
        <div className="mb-2">{validation.warningMessage}</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Completeness:</span>
          <Progress value={completenessPercentage} className="h-2 flex-1" />
          <span className="text-sm font-medium">{completenessPercentage}%</span>
        </div>
        
        {showDetails && validation.missingFields.length > 0 && (
          <div className="mt-2 text-sm">
            <p className="font-medium mb-1">Missing information:</p>
            <ul className="list-disc pl-5">
              {validation.missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DataCompletionWarning;
