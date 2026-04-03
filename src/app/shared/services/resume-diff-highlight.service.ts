import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ResumeDiffHighlightService {
  private readonly sanitizer = inject(DomSanitizer);

  highlightKeywords(text: string, keywords: string[]): SafeHtml {
    if (!keywords?.length || !text) {
      return this.sanitizer.bypassSecurityTrustHtml(text ?? '');
    }
    let result = text;
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    for (const kw of sorted) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`\\b(${escaped})\\b`, 'gi'),
        '<mark class="rd-kw-highlight">$1</mark>',
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}
