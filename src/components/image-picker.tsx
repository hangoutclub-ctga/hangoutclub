"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Link as LinkIcon, X, Check, Loader2, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayAvatarUrl, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { uploadFileToStorage, uploadDataUrlToStorage } from "@/lib/supabase/storage";

interface ImagePickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  aspect?: "circle" | "square" | "video";
  folder?: string;
}

export function ImagePicker({ value, onChange, className, label, aspect = "circle", folder = "general" }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'options' | 'link' | 'camera'>('options');
  const [linkValue, setLinkValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Processando...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPDF = value?.startsWith('data:application/pdf') || value?.toLowerCase().endsWith('.pdf');
  const displayUrl = getDisplayAvatarUrl(value);

  const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 1200;
        if (width > height && width > max) {
          height *= max / width;
          width = max;
        } else if (height > max) {
          width *= max / height;
          height = max;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus("Otimizando e enviando...");
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const rawDataUrl = event.target?.result as string;
            const compressed = await compressImage(rawDataUrl);
            setProcessingStatus("Salvando no storage...");
            const { url, error } = await uploadDataUrlToStorage(compressed, folder, file.name);
            if (error) {
              toast({ variant: "destructive", title: "Erro no envio", description: error });
            } else if (url) {
              onChange(url);
              toast({ title: "Arquivo anexado!", description: "Upload concluído com sucesso." });
              setIsOpen(false);
            }
          } catch (err: any) {
            toast({ variant: "destructive", title: "Erro ao processar", description: err.message });
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // PDF ou outro arquivo
        setProcessingStatus("Enviando arquivo...");
        const { url, error } = await uploadFileToStorage(file, folder, file.name);
        if (error) {
          toast({ variant: "destructive", title: "Erro no envio", description: error });
        } else if (url) {
          onChange(url);
          toast({ title: "Arquivo anexado!", description: "Upload concluído com sucesso." });
          setIsOpen(false);
        }
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: err.message });
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast({ variant: 'destructive', title: "Erro na Câmera", description: "Não foi possível acessar a câmera." });
      setMode('options');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUri = canvas.toDataURL('image/jpeg', 0.9);
    
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    
    setIsProcessing(true);
    setProcessingStatus("Salvando foto no storage...");
    try {
      const compressed = await compressImage(dataUri);
      const { url, error } = await uploadDataUrlToStorage(compressed, folder, `foto-${Date.now()}.jpg`);
      if (error) {
        toast({ variant: "destructive", title: "Erro no envio", description: error });
      } else if (url) {
        onChange(url);
        toast({ title: "Foto salva!", description: "Upload concluído com sucesso." });
        setIsOpen(false);
        setMode('options');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkSave = () => {
    if (linkValue) {
      onChange(linkValue);
      setIsOpen(false);
      setLinkValue("");
      setMode('options');
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative group">
        <div className={cn(
            "overflow-hidden border-4 border-background shadow-xl bg-muted flex items-center justify-center relative",
            aspect === 'circle' ? "rounded-full h-24 w-24 sm:h-32 sm:w-32" : "rounded-xl h-24 w-32 sm:h-32 sm:w-40"
        )}>
          {isPDF ? (
              <div className="flex flex-col items-center gap-1">
                  <FileText className="h-10 w-10 text-red-500" />
                  <span className="text-[8px] font-bold uppercase text-muted-foreground">PDF</span>
              </div>
          ) : (
              <img src={displayUrl} alt="Preview" className="h-full w-full object-cover" />
          )}
          
          {value && (
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
          )}
        </div>
        
        <Button 
          variant="secondary" 
          size="icon" 
          className="absolute -bottom-2 -right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg border-2 border-background"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
      </div>
      {label && <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{label}</p>}

      <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
              setMode('options');
              if (videoRef.current?.srcObject) {
                  const stream = videoRef.current.srcObject as MediaStream;
                  stream.getTracks().forEach(track => track.stop());
              }
          }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Arquivo</DialogTitle>
          </DialogHeader>

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
                {processingStatus}
              </p>
            </div>
          ) : (
            <>
              {mode === 'options' && (
                <div className="grid grid-cols-1 gap-3 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl text-[10px] font-bold uppercase" onClick={startCamera} type="button">
                        <Camera className="h-6 w-6 text-accent" /> Câmera
                    </Button>
                    <div className="relative">
                        <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" onChange={handleFileUpload} />
                        <Button variant="outline" className="h-20 w-full flex-col gap-2 rounded-xl text-[10px] font-bold uppercase pointer-events-none">
                            <Upload className="h-6 w-6 text-accent" /> Arquivo (Img/PDF)
                        </Button>
                    </div>
                  </div>
                  <Button variant="outline" className="h-12 justify-start gap-3 rounded-xl text-[10px] font-bold uppercase" onClick={() => setMode('link')} type="button">
                    <LinkIcon className="h-5 w-5 text-accent" /> Colar Link da Imagem
                  </Button>
                </div>
              )}

          {mode === 'link' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">URL da Imagem</label>
                <Input 
                  placeholder="https://exemplo.com/foto.jpg" 
                  value={linkValue} 
                  onChange={(e) => setLinkValue(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 h-11" onClick={() => setMode('options')} type="button">Voltar</Button>
                <Button className="flex-1 bg-accent h-11" onClick={handleLinkSave} type="button">Salvar Link</Button>
              </div>
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-4 py-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 h-11" onClick={() => setMode('options')} type="button">Voltar</Button>
                <Button className="flex-1 gap-2 bg-accent h-11" onClick={capturePhoto} type="button">
                  <Check className="h-4 w-4" /> Capturar Agora
                </Button>
              </div>
            </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
