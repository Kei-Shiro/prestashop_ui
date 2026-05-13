import JSZip from 'jszip';
import type { ExtractedImage, ZipExtractionResult } from '@features/import/types/import.types';

export interface ExtractedFile {
  filename: string;
  content: string;
}

const CSV_EXTENSIONS = ['.csv', '.tsv', '.txt'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

/**
 * Détermine le type MIME à partir de l'extension
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Extrait la référence produit depuis le nom de fichier
 * Ex: "T_01.jpg" → "T_01", "images/P_02.png" → "P_02"
 */
function extractReference(filepath: string): string {
  const filename = filepath.replace(/^.*[\\/]/, ''); // nom seul sans chemin
  return filename.replace(/\.[^.]+$/, ''); // supprimer l'extension
}

/**
 * Vérifie si un fichier est un CSV
 */
function isCsvFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return CSV_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Vérifie si un fichier est une image
 */
function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Extracts all CSV files from a ZIP archive (legacy compatible)
 * @param zipFile - The ZIP file to extract
 * @returns Array of extracted CSV files with filename and content
 * @throws Error if no CSV files found in the archive
 */
export async function extractZipFile(zipFile: File): Promise<ExtractedFile[]> {
  const result = await extractZipComplete(zipFile);
  return result.csvFiles.map(f => ({ filename: f.filename, content: f.content }));
}

/**
 * Extraction complète d'un ZIP : CSV + images
 * @param zipFile - Le fichier ZIP à extraire
 * @returns Objet avec csvFiles et imageFiles
 */
export async function extractZipComplete(zipFile: File): Promise<ZipExtractionResult> {
  const arrayBuffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const csvFiles: ExtractedFile[] = [];
  const imageFiles: ExtractedImage[] = [];

  const promises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;

    // Ignorer les fichiers cachés (macOS __MACOSX, .DS_Store, etc.)
    if (relativePath.startsWith('__MACOSX') || relativePath.startsWith('.')) return;

    if (isCsvFile(relativePath)) {
      const promise = zipEntry.async('string').then((content) => {
        csvFiles.push({ filename: relativePath, content });
      });
      promises.push(promise);
    } else if (isImageFile(relativePath)) {
      const promise = zipEntry.async('blob').then((blob) => {
        const mimeType = getMimeType(relativePath);
        const typedBlob = new Blob([blob], { type: mimeType });
        imageFiles.push({
          filename: relativePath.replace(/^.*[\\/]/, ''),
          blob: typedBlob,
          reference: extractReference(relativePath),
          mimeType,
        });
      });
      promises.push(promise);
    }
  });

  await Promise.all(promises);

  console.log(`ZIP extraction: ${csvFiles.length} CSV, ${imageFiles.length} images`);
  return { csvFiles, imageFiles };
}