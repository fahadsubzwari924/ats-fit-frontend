import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BlobDownloadService {
  /**
   * Trigger a browser download of a Blob with the given filename.
   * Cleans up the object URL after the click handler fires.
   */
  download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Decode a base64-encoded payload to a Blob with the given MIME type and trigger download.
   */
  downloadFromBase64(base64: string, filename: string, mimeType: string): void {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mimeType });
    this.download(blob, filename);
  }
}
