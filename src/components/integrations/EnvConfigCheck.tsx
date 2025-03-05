
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function EnvConfigCheck() {
  const [missingConfigs, setMissingConfigs] = useState<string[]>([]);

  useEffect(() => {
    const configs = [];
    
    if (!import.meta.env.VITE_FACEBOOK_APP_ID) {
      configs.push("VITE_FACEBOOK_APP_ID");
    }
    
    setMissingConfigs(configs);
  }, []);

  if (missingConfigs.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Configuration</AlertTitle>
      <AlertDescription>
        <p>The following environment variables are missing:</p>
        <ul className="list-disc ml-5 mt-2">
          {missingConfigs.map(config => (
            <li key={config}>{config}</li>
          ))}
        </ul>
        <p className="mt-2">
          Please add these variables to your environment to enable all integration features.
        </p>
      </AlertDescription>
    </Alert>
  );
}
