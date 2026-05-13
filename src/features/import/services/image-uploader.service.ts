import type { ExtractedImage } from '../types/import.types';
import apiService from '@shared/services/api-service';

export interface UploadImageResult {
  success: boolean;
  imageId?: number;
  reference: string;
  error?: string;
}

export async function uploadProductImages(
  images: ExtractedImage[],
  onProgress?: (current: number, total: number) => void
): Promise<UploadImageResult[]> {
  const results: UploadImageResult[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    try {
      const formData = new FormData();
      formData.append('image', image.blob, image.filename);
      formData.append('reference', image.reference);
      
      const response = await apiService.post('/products/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      results.push({
        success: true,
        imageId: response.data?.image?.id || response.data?.id,
        reference: image.reference,
      });
    } catch (error: any) {
      results.push({
        success: false,
        reference: image.reference,
        error: error.message || 'Upload failed',
      });
    }
    
    onProgress?.(i + 1, images.length);
  }
  
  return results;
}

export async function uploadSingleImage(
  image: ExtractedImage,
  productId: number
): Promise<UploadImageResult> {
  try {
    const formData = new FormData();
    formData.append('image', image.blob, image.filename);
    formData.append('id_product', productId.toString());
    
    const response = await apiService.post('/products/' + productId + '/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      imageId: response.data?.image?.id || response.data?.id,
      reference: image.reference,
    };
  } catch (error: any) {
    return {
      success: false,
      reference: image.reference,
      error: error.message || 'Upload failed',
    };
  }
}
