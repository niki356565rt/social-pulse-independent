import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, Image, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaUploadProps {
  onUpload: (urls: string[]) => void;
  uploadedUrls: string[];
  onRemove: (url: string) => void;
  maxFiles?: number;
  accept?: string;
}

export const MediaUpload = ({
  onUpload,
  uploadedUrls,
  onRemove,
  maxFiles = 10,
  accept = 'image/*,video/*',
}: MediaUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('post-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - uploadedUrls.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximal ${maxFiles} Dateien erlaubt`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadFile);
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);

      if (successfulUploads.length > 0) {
        onUpload(successfulUploads);
        toast.success(`${successfulUploads.length} Datei(en) hochgeladen`);
      }

      if (successfulUploads.length < filesToUpload.length) {
        toast.error('Einige Dateien konnten nicht hochgeladen werden');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|mov|webm|avi)(\?|$)/i);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium">Dateien hierher ziehen oder klicken</p>
            <p className="text-xs text-muted-foreground">
              Bilder und Videos ({uploadedUrls.length}/{maxFiles})
            </p>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {uploadedUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              {isVideo(url) ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(url);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1.5 py-0.5 text-xs">
                {isVideo(url) ? <Video className="w-3 h-3 inline mr-1" /> : <Image className="w-3 h-3 inline mr-1" />}
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
