import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconsConstant } from '../../../../core/constants/icons.contant';


@Component({
  selector: 'app-button-demo',
  imports: [ButtonComponent],
  templateUrl: './button-demo.component.html',
  styleUrl: './button-demo.component.scss'
})
export class ButtonDemoComponent {
  isLoading = signal(false);
  isDisabled = signal(false);
  isDisabledExample = signal(true);

  // External icon URLs for demo
  externalIconUrl = 'https://img.icons8.com/fluency/24/github.png';
  customSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
  </svg>`;

  IconsConstant = IconsConstant;

  handleButtonClick(event: Event) {
    console.log('Button clicked:', event);
  }

  handleLoadingDemo() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 3000);
  }

  toggleDisabled() {
    this.isDisabled.set(!this.isDisabled());
  }

  downloadFile() {
    console.log('Downloading file...');
  }

  generateResume() {
    console.log('Generating resume...');
    this.handleLoadingDemo();
  }

  goBack() {
    console.log('Going back...');
  }

  closeModal() {
    console.log('Closing modal...');
  }
}
