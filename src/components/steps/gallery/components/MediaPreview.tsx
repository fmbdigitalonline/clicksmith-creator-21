interface MediaPreviewProps {
  imageUrl: string | null;
  isVideo?: boolean;
}

const MediaPreview = ({ imageUrl, isVideo = false }: MediaPreviewProps) => {
  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No media available</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Video Preview</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Ad preview"
      className="object-cover w-full h-full rounded-lg"
    />
  );
};

export default MediaPreview;