import JSZip from 'jszip';

export interface ExtractedFile {
  filename: string;
  content: string;
}

/**
 * Extracts all CSV files from a ZIP archive
 * @param zipFile - The ZIP file to extract
 * @returns Array of extracted CSV files with filename and content
 * @throws Error if no CSV files found in the archive
 */
export async function extractZipFile(zipFile: File): Promise<ExtractedFile[]> {
  const arrayBuffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const csvFiles: ExtractedFile[] = [];

  // Iterate through all files in the ZIP
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) {
      return; // Skip directories
    }

    // Only process .csv files
    if (!relativePath.toLowerCase().endsWith('.csv')) {
      return;
    }

    const promise = zipEntry.async('string').then((content) => {
      csvFiles.push({
        filename: relativePath,
        content,
      });
    });

    filePromises.push(promise);
  });

  await Promise.all(filePromises);

  if (csvFiles.length === 0) {
    throw new Error('No CSV files found in the ZIP archive');
  }

  return csvFiles;
}