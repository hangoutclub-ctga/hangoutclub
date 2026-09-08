import { createClient } from './client';

export const STORAGE_BUCKET = 'hangout-bucket';

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Converte uma string base64 / Data URI para um Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Faz upload de um File ou Blob para o bucket 'hangout-bucket' do Supabase Storage
 */
export async function uploadFileToStorage(
  file: File | Blob,
  folder: string = 'general',
  fileName?: string
): Promise<UploadResult> {
  const supabase = createClient();

  try {
    let extension = 'jpg';
    if (file instanceof File && file.name.includes('.')) {
      extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    } else if (file.type) {
      if (file.type === 'application/pdf') extension = 'pdf';
      else if (file.type === 'image/png') extension = 'png';
      else if (file.type === 'image/webp') extension = 'webp';
      else if (file.type === 'image/gif') extension = 'gif';
      else if (file.type === 'image/jpeg') extension = 'jpg';
    }

    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const finalFileName = fileName
      ? `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      : `${Date.now()}-${randomSuffix}.${extension}`;

    const filePath = cleanFolder ? `${cleanFolder}/${finalFileName}` : finalFileName;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('Erro no upload para o Supabase Storage:', uploadError);
      let message = uploadError.message;
      if (message.toLowerCase().includes('row-level security') || message.toLowerCase().includes('policy')) {
        message = "Permissão negada no storage. Certifique-se de que as políticas RLS do bucket 'hangout-bucket' foram aplicadas no Supabase.";
      }
      return { url: '', error: message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('Exceção ao fazer upload para o storage:', err);
    return { url: '', error: err?.message || 'Erro inesperado ao enviar arquivo.' };
  }
}

/**
 * Faz upload de uma imagem em formato Data URI / base64 para o Supabase Storage
 */
export async function uploadDataUrlToStorage(
  dataUrl: string,
  folder: string = 'general',
  fileName?: string
): Promise<UploadResult> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    return await uploadFileToStorage(blob, folder, fileName);
  } catch (err: any) {
    console.error('Erro ao converter dataUrl para Blob:', err);
    return { url: '', error: 'Falha ao processar a imagem para upload.' };
  }
}

/**
 * Remove um arquivo do bucket através de sua URL pública
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<boolean> {
  if (!fileUrl || !fileUrl.includes(STORAGE_BUCKET)) return false;

  const supabase = createClient();
  try {
    const parts = fileUrl.split(`${STORAGE_BUCKET}/`);
    if (parts.length < 2) return false;
    const filePath = decodeURIComponent(parts[1]);
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    return !error;
  } catch {
    return false;
  }
}
