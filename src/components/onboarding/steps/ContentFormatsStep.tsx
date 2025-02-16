
import { CheckCircle2 } from "lucide-react";

interface ContentFormatsStepProps {
  userType: string;
}

export function ContentFormatsStep({ userType }: ContentFormatsStepProps) {
  const getFormats = () => {
    const formats = [
      {
        title: "Facebook & Instagram Ads",
        description: "Create eye-catching social media ads"
      },
      {
        title: "Landing Pages",
        description: "Build high-converting landing pages"
      },
      {
        title: "Google Display Ads",
        description: "Reach audiences across the web"
      }
    ];

    if (userType === 'creator') {
      formats.push({
        title: "Social Media Posts",
        description: "Design engaging content for your followers"
      });
    }

    return formats;
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-4">
        {getFormats().map((format, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-facebook mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">{format.title}</h4>
              <p className="text-sm text-muted-foreground">{format.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
