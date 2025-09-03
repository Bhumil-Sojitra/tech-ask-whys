import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Crop as CropIcon, Check, X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarUploadCropProps {
  currentAvatar?: string;
  username: string;
  onAvatarChange: (avatarUrl: string) => void;
}

const AvatarUploadCrop = ({ currentAvatar, username, onAvatarChange }: AvatarUploadCropProps) => {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
      setOpen(true);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    const cropSize = Math.min(width, height);
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: 'px',
          width: cropSize,
          height: cropSize,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to desired output size (200x200 for avatar)
      canvas.width = 200;
      canvas.height = 200;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        200,
        200
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });
    },
    []
  );

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      // Convert blob to base64 for preview (in a real app, you'd upload to server/storage)
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onAvatarChange(base64);
        setOpen(false);
        setImgSrc('');
      };
      reader.readAsDataURL(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [completedCrop, getCroppedImg, onAvatarChange]);

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentAvatar} alt={username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Change Avatar</span>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="hidden"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CropIcon className="h-5 w-5" />
              <span>Crop Your Avatar</span>
            </DialogTitle>
          </DialogHeader>
          
          {imgSrc && (
            <div className="space-y-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
                />
              </ReactCrop>
              
              <p className="text-sm text-muted-foreground text-center">
                Drag to reposition and resize your avatar
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setImgSrc('');
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropComplete}
              disabled={!completedCrop}
            >
              <Check className="h-4 w-4 mr-2" />
              Save Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUploadCrop;