export function AdFormatsStep() {
  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="font-medium mb-2">Image Ads</p>
          <div className="aspect-video bg-muted rounded-md mb-2" />
          <p className="text-sm text-muted-foreground">
            Static images optimized for feed and sidebar placements
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="font-medium mb-2">Carousel Ads</p>
          <div className="aspect-video bg-muted rounded-md mb-2" />
          <p className="text-sm text-muted-foreground">
            Multiple images to showcase products or features
          </p>
        </div>
      </div>
    </div>
  );
}