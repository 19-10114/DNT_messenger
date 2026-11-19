/**
 * Tipos TypeScript para gestión de imágenes de productos
 */

export type ImageValidationErrorType = 'format' | 'size' | 'limit' | 'general';

export interface ImageValidationError {
  type: ImageValidationErrorType;
  message: string;
  fileName?: string;
}

export interface ImageSettings {
  isFeatured: boolean;
  isVisible: boolean;
  color: string;
}

export interface ImagePreview {
  file: File;
  url: string;
  settings: ImageSettings;
}

export interface LoadingState {
  uploading: boolean;
  deleting: Record<number, boolean>;
  updating: Record<number, boolean>;
}

export interface ImageOperationResult {
  success: boolean;
  message: string;
  error?: unknown;
}

export interface ImageUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface ImageManagementState {
  productImages: File[];
  imageErrors: ImageValidationError[];
  newImageSettings: Record<number, ImageSettings>;
  loadingState: LoadingState;
  uploadProgress: ImageUploadProgress[];
}

export type ImageAction =
  | { type: 'ADD_IMAGES'; payload: File[] }
  | { type: 'REMOVE_IMAGE'; payload: number }
  | {
      type: 'UPDATE_SETTINGS';
      payload: { index: number; key: keyof ImageSettings; value: any };
    }
  | { type: 'SET_ERRORS'; payload: ImageValidationError[] }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'RESET_STATE' };
