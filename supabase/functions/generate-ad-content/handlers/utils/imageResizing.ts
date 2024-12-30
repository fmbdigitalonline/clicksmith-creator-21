interface ImageSize {
  width: number;
  height: number;
  label: string;
}

export const AD_SIZES: ImageSize[] = [
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 1200, height: 628, label: "Landscape (1.91:1)" },
  { width: 1080, height: 1920, label: "Vertical (9:16)" }
];

export async function resizeImage(imageUrl: string): Promise<Record<string, string>> {
  const resizedUrls: Record<string, string> = {};
  
  for (const size of AD_SIZES) {
    const resizedUrl = await generateWithReplicate(
      `Resize this image to ${size.width}x${size.height} while maintaining aspect ratio and quality. Original image: ${imageUrl}`,
      { width: size.width, height: size.height }
    );
    resizedUrls[`${size.width}x${size.height}`] = resizedUrl;
  }
  
  return resizedUrls;
}