import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt: string;
}

export function ImageModal({ open, onOpenChange, imageUrl, alt }: ImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden animate-scale-in">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="relative w-full">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto max-h-[85vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
