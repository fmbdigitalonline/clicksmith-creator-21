interface MediaPreviewProps {
  imageUrl: string | null;
  isVideo?: boolean;
  format: {
    width: number;
    height: number;
    label: string;
  };
}

const MediaPreview = ({ imageUrl, isVideo, format }: MediaPreviewProps) => {
  if (isVideo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Video Preview</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No image available</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`Ad preview (${format.label})`}
      className="object-cover w-full h-full transition-transform duration-300 ease-in-out"
    />
  );
};

export default MediaPreview;