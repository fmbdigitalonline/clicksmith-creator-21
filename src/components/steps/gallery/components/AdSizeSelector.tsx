import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AD_FORMATS = [
  { width: 1200, height: 628, label: "Landscape (1.91:1)" },
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 1080, height: 1920, label: "Story (9:16)" }
];

interface AdSizeSelectorProps {
  selectedFormat: { width: number; height: number; label: string };
  onFormatChange: (format: { width: number; height: number; label: string }) => void;
}

export const AdSizeSelector = ({ selectedFormat, onFormatChange }: AdSizeSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Format:</span>
      <Select
        value={`${selectedFormat.width}x${selectedFormat.height}`}
        onValueChange={(value) => {
          const [width, height] = value.split('x').map(Number);
          const format = AD_FORMATS.find(f => f.width === width && f.height === height);
          if (format) onFormatChange(format);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          {AD_FORMATS.map((format) => (
            <SelectItem 
              key={`${format.width}x${format.height}`} 
              value={`${format.width}x${format.height}`}
            >
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};