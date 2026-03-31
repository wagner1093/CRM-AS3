import { useRef, useState, DragEvent } from "react";
import { useVehicleImages, useUploadVehicleImage, useDeleteVehicleImage, useReorderVehicleImages, VehicleImage } from "@/hooks/useVehicleImages";
import { ImagePlus, X, Loader2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  vehicleId: string | undefined;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
}

export function VehiclePhotoUpload({ vehicleId, pendingFiles, onPendingFilesChange }: Props) {
  const { data: images = [] } = useVehicleImages(vehicleId);
  const upload = useUploadVehicleImage();
  const remove = useDeleteVehicleImage();
  const reorder = useReorderVehicleImages();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pendingDragIndex, setPendingDragIndex] = useState<number | null>(null);
  const [pendingDragOverIndex, setPendingDragOverIndex] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!vehicleId) {
      onPendingFilesChange?.([...(pendingFiles || []), ...Array.from(files)]);
      return;
    }
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Arquivo muito grande", description: "Máximo 10MB por foto", variant: "destructive" });
          continue;
        }
        await upload.mutateAsync({ vehicleId, file, position: images.length + i });
      }
      toast({ title: "📸 Fotos enviadas!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (img: VehicleImage) => {
    try {
      await remove.mutateAsync({ id: img.id, storagePath: img.storage_path });
      toast({ title: "Foto removida" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleRemovePending = (index: number) => {
    if (!pendingFiles || !onPendingFilesChange) return;
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  // Drag & drop for saved images
  const onDragStart = (e: DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const onDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const reordered = [...images];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      const updates = reordered.map((img, i) => ({ id: img.id, position: i }));
      reorder.mutate(updates);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Drag & drop for pending files
  const onPendingDragStart = (e: DragEvent, index: number) => {
    setPendingDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const onPendingDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    setPendingDragOverIndex(index);
  };
  const onPendingDragEnd = () => {
    if (pendingFiles && onPendingFilesChange && pendingDragIndex !== null && pendingDragOverIndex !== null && pendingDragIndex !== pendingDragOverIndex) {
      const reordered = [...pendingFiles];
      const [moved] = reordered.splice(pendingDragIndex, 1);
      reordered.splice(pendingDragOverIndex, 0, moved);
      onPendingFilesChange(reordered);
    }
    setPendingDragIndex(null);
    setPendingDragOverIndex(null);
  };

  const hasPending = pendingFiles && pendingFiles.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={e => onDragStart(e, i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            className={`relative group w-20 h-20 rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing transition-all ${
              dragOverIndex === i ? "border-primary ring-2 ring-primary/30 scale-105" : "border-border"
            } ${dragIndex === i ? "opacity-40" : ""}`}
          >
            <img src={img.url} alt="Foto do veículo" className="w-full h-full object-cover" />
            <div className="absolute top-0.5 left-0.5 bg-background/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(img)}
              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[9px] text-primary-foreground text-center py-0.5">
                Capa
              </div>
            )}
          </div>
        ))}

        {hasPending && pendingFiles!.map((file, i) => (
          <div
            key={`pending-${i}`}
            draggable
            onDragStart={e => onPendingDragStart(e, i)}
            onDragOver={e => onPendingDragOver(e, i)}
            onDragEnd={onPendingDragEnd}
            className={`relative group w-20 h-20 rounded-xl overflow-hidden border border-dashed cursor-grab active:cursor-grabbing transition-all ${
              pendingDragOverIndex === i ? "border-primary ring-2 ring-primary/30 scale-105" : "border-primary/40"
            } ${pendingDragIndex === i ? "opacity-40" : ""}`}
          >
            <img src={URL.createObjectURL(file)} alt="Pendente" className="w-full h-full object-cover opacity-70" />
            <button
              type="button"
              onClick={() => handleRemovePending(i)}
              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[9px] text-primary-foreground text-center py-0.5">
              Pendente
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Adicionar</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
