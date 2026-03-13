import { Component, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconsConstant } from '@core/constants/icons.contant';
import { ButtonSize, ButtonType, ButtonVariant, IconAlign, IconType } from './enums/button.enum';
import { BaseClasses, SizeClasses, VariantClasses } from './constants/button.contants';
import { tButtonSize, tButtonType, tButtonVariant, tIconAlign, tIconType } from './types/button.types';


@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  constructor(private sanitizer: DomSanitizer) {}

  type = input<tButtonType>(ButtonType.BUTTON);
  variant = input<tButtonVariant>(ButtonVariant.PRIMARY);
  size = input<tButtonSize>(ButtonSize.MD);
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  fullWidth = input<boolean>(false);
  text = input<string>('');
  ariaLabel = input<string>('');

  // Simplified icon system
  icon = input<string>('');
  iconAlign = input<tIconAlign>(IconAlign.LEFT);
  iconType = input<tIconType>(IconType.SVG);
  iconClass = input<string>('h-4 w-4');
  customClass = input<string>('');

  // Emitters
  @Output() onClick = new EventEmitter<Event>();


  // Internal State
  IconType = IconType;

  handleClick(event: Event) {
    if (!this.disabled() && !this.loading()) {
      this.onClick.emit(event);
    }
  }

  get buttonClasses(): string {

    // Width classes
    const widthClasses = this.fullWidth() ? ['w-full'] : [];

    // Loading classes
    const loadingClasses = this.loading() ? ['cursor-wait'] : [];

    // Add custom classes if provided
    if (this.customClass()) {
      return this.customClass();
    }

    // Combine all classes
    let allClasses = [
      ...BaseClasses,
      ...SizeClasses[this.size()],
      ...VariantClasses[this.variant()],
      ...widthClasses,
      ...loadingClasses
    ];

    return allClasses.join(' ');
  }

  get isDisabled(): boolean {
    return this.disabled() || this.loading();
  }

  // Helper methods
  get hasLeftIcon(): boolean {
    return !!(this.icon() && this.iconAlign() === IconAlign.LEFT);
  }

  get hasRightIcon(): boolean {
    return !!(this.icon() && this.iconAlign() === IconAlign.RIGHT);
  }

  // Check if icon is an external image URL
  get isExternalImage(): boolean {
    return this.icon().match(/^https?:\/\/|^\/|^\.|\.(?:jpg|jpeg|png|gif|webp|svg)$/i) !== null;
  }

  // Get icon content based on type
  get getIconContent(): string | SafeHtml {
    if (!this.icon()) {
      return '';
    }

    if (this.iconType() === IconType.SVG) {
      // Check if it's a key from IconsConstant or direct SVG content
      const result = this.getSvgFromConstant(this.icon()) || this.icon();
      // Sanitize the SVG content for safe HTML rendering
      return this.sanitizer.bypassSecurityTrustHtml(result);
    }

    if (this.iconType() === IconType.MATERIAL) {
      // Return material icon name as-is
      return this.icon();
    }

    return '';
  }

  // Get SVG content from icons constant
  private getSvgFromConstant(iconKey: string): string {
    const svgContent = IconsConstant.SVG_ICONS[iconKey as keyof typeof IconsConstant.SVG_ICONS] || '';

    // Replace Angular binding syntax with actual class
    if (svgContent) {
      // Remove Angular binding syntax and add the class directly
      const processedSvg = svgContent.replace(/\[class\]="iconClass"/g, `class="${this.iconClass()}"`);
      return processedSvg;
    }

    return '';
  }

}
