interface AdPreviewImageProps {
  imageUrl: string | null;
  selectedSize: {
    width: number;
    height: number;
  };
}

const AdPreviewImage = ({ imageUrl, selectedSize }: AdPreviewImageProps) => {
  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Image preview not available</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Ad preview"
      className="object-cover w-full h-full"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  );
};

export default AdPreviewImage;