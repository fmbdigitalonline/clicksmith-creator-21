export function GettingStartedStep() {
  return (
    <div className="space-y-6 mt-4">
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Quick Start Guide</h4>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start">
            <span className="font-medium text-facebook mr-2">1.</span>
            Create a new project from the dashboard
          </li>
          <li className="flex items-start">
            <span className="font-medium text-facebook mr-2">2.</span>
            Follow the AI wizard to define your campaign goals
          </li>
          <li className="flex items-start">
            <span className="font-medium text-facebook mr-2">3.</span>
            Review and customize generated ad content
          </li>
          <li className="flex items-start">
            <span className="font-medium text-facebook mr-2">4.</span>
            Export your ads to Facebook
          </li>
        </ol>
      </div>
      <p className="text-sm text-muted-foreground">
        Don't worry, we'll guide you through each step of the process!
      </p>
    </div>
  );
}