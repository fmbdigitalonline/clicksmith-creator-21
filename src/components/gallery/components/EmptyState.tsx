import { Card } from "@/components/ui/card";

export const EmptyState = () => {
  return (
    <Card className="p-6">
      <p className="text-center text-gray-500">
        No saved ads yet. Like or favorite ads to see them here!
      </p>
    </Card>
  );
};