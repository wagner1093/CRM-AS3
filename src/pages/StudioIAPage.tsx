import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Download, RotateCcw, ImageIcon, Loader2, Check, RectangleHorizontal, Smartphone, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import bgShowroom from "@/assets/bg-showroom.jpg";
import bgCity from "@/assets/bg-city.jpg";
import bgMountain from "@/assets/bg-mountain.jpg";
import bgBeach from "@/assets/bg-beach.jpg";
import bgGarage from "@/assets/bg-garage.jpg";
import bgNight from "@/assets/bg-night.jpg";

const backgrounds = [
  { id: "showroom", label: "Showroom", img: bgShowroom, description: "A clean white luxury car showroom with polished reflective floor, soft studio lighting from above, minimalist automotive dealership" },
  { id: "city", label: "Cidade", img: bgCity, description: "A modern city boulevard at golden hour sunset, dramatic warm lighting, urban skyline background" },
  { id: "mountain", label: "Montanha", img: bgMountain, description: "A scenic mountain road with dramatic green landscape, golden hour warm lighting, winding highway" },
  { id: "beach", label: "Praia", img: bgBeach, description: "A tropical beach at sunset with golden sand, palm trees, warm orange lighting, ocean in background" },
  { id: "garage", label: "Garage", img: bgGarage, description: "A dark luxury garage with dramatic spotlights, polished concrete floor, moody industrial atmosphere" },
  { id: "night", label: "Noturno", img: bgNight, description: "A neon-lit city street at night, wet reflective asphalt, cyberpunk urban atmosphere with colorful neon lights" },
];

export default function StudioIAPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState<string>("showroom");
  const [format, setFormat] = useState<string>("1:1");
  const [quality, setQuality] = useState<string>("2k");
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie apenas imagens", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 15MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const imageToBase64 = useCallback((imgSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => reject(new Error("Failed to load background image"));
      img.src = imgSrc;
    });
  }, []);

  const handleProcess = async () => {
    if (!originalImage) return;
    setProcessing(true);
    setProcessedImage(null);

    const bg = backgrounds.find(b => b.id === selectedBg);

    try {
      const backgroundBase64 = await imageToBase64(bg?.img || bgShowroom);

      const { data, error } = await supabase.functions.invoke("studio-ia-process", {
        body: {
          imageBase64: originalImage,
          backgroundBase64,
          format,
          quality,
        },
      });

      if (error) throw new Error(error.message || "Erro ao processar");
      if (data?.error) throw new Error(data.error);
      if (!data?.image) throw new Error("Nenhuma imagem retornada");

      setProcessedImage(data.image);
      toast({ title: "✨ Imagem processada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no processamento", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `studio-ia-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setFormat("1:1");
    setQuality("2k");
    setSelectedBg("showroom");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-accent" />
            Estúdio IA
          </h1>
          <p>Transforme suas fotos de veículos com inteligência artificial</p>
        </div>
        {originalImage && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Recomeçar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Main area */}
        <div className="space-y-6">
          {/* Upload / Preview */}
          <AnimatePresence mode="wait">
            {!originalImage ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`glass-card flex flex-col items-center justify-center p-12 min-h-[420px] cursor-pointer transition-all duration-300 ${
                  dragOver ? "ring-2 ring-accent scale-[1.01]" : ""
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mb-6"
                >
                  <Upload className="w-9 h-9 text-accent" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Envie a foto do veículo</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Arraste e solte ou clique para selecionar. Suporta JPG, PNG e WEBP até 15MB.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card overflow-hidden"
              >
                {/* Before/After toggle */}
                <div className="flex items-center gap-2 p-4 border-b border-border">
                  <div className="flex gap-1 bg-secondary rounded-full p-1">
                    <button
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                        !processedImage ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Original
                    </button>
                    <button
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                        processedImage ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                      disabled={!processedImage}
                    >
                      Processada
                    </button>
                  </div>
                  <div className="flex-1" />
                  {processedImage && (
                    <Button size="sm" onClick={handleDownload} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Download className="w-4 h-4" />
                      Baixar
                    </Button>
                  )}
                </div>

                <div className="relative aspect-video bg-secondary/30 flex items-center justify-center overflow-hidden">
                  {processing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                    >
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-accent" />
                        <Sparkles className="w-5 h-5 text-accent absolute -top-1 -right-1 animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Processando com IA...</p>
                        <p className="text-xs text-muted-foreground mt-1">Isso pode levar até 30 segundos</p>
                      </div>
                    </motion.div>
                  )}

                  <img
                    src={processedImage || originalImage}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background selector */}
          {originalImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent" />
                Escolha o cenário
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {backgrounds.map((bg) => (
                  <motion.button
                    key={bg.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBg(bg.id)}
                    className={`relative rounded-xl overflow-hidden aspect-video transition-all duration-200 ${
                      selectedBg === bg.id
                        ? "ring-2 ring-accent shadow-lg"
                        : "ring-1 ring-border hover:ring-muted-foreground/30"
                    }`}
                  >
                    <img src={bg.img} alt={bg.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-1 left-0 right-0 text-[10px] font-medium text-white text-center">
                      {bg.label}
                    </span>
                    {selectedBg === bg.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-accent-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right sidebar - Controls */}
        {originalImage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Adjustments */}
            <div className="glass-card p-5 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Formato</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "1:1", label: "1×1", desc: "Quadrado", icon: Square },
                  { id: "3:4", label: "3×4", desc: "Feed Instagram", icon: RectangleHorizontal },
                  { id: "9:16", label: "9×16", desc: "Stories / Reels", icon: Smartphone },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      format === f.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    <f.icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{f.label}</span>
                    <span className="text-[10px] leading-tight">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="glass-card p-5 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Qualidade</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "2k", label: "2K", desc: "2048px" },
                  { id: "4k", label: "4K", desc: "4096px" },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQuality(q.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      quality === q.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="text-sm font-bold">{q.label}</span>
                    <span className="text-[10px]">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Process button */}
            <Button
              onClick={handleProcess}
              disabled={processing || !originalImage}
              className="w-full h-12 gap-2.5 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold rounded-xl shadow-lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Imagem
                </>
              )}
            </Button>

            {/* Tips */}
            <div className="glass-card p-4 space-y-2">
              <h4 className="text-xs font-semibold text-foreground">💡 Dicas</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Use fotos com boa iluminação</li>
                <li>• Ângulos laterais funcionam melhor</li>
                <li>• Fundos simples facilitam a remoção</li>
                <li>• A IA ajusta luz e sombras automaticamente</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}
