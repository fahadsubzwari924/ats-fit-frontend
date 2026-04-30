import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "@root/layout/components/header/header.component";
import { FooterComponent } from "@root/layout/components/footer/footer.component";
import { BetaBannerComponent } from "@root/beta-banner/beta-banner.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BetaBannerComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

}
