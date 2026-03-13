import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { StorageService } from '@shared/services/storage.service';
import { ResumeState } from '@core/states/resume.state';
import { UserState } from '@core/states/user.state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  // Inject the Router service to handle navigation
  private router = inject(Router);
  private storageService = inject(StorageService);
  private resumeState = inject(ResumeState);
  private userState = inject(UserState);


  // Signal to manage authentication state
  public isAuthenticated = signal<boolean>(false); // Assuming you have a way to check authentication

  constructor() {}

  ngOnInit() {
    this.isAuthenticated.set(this.storageService.getToken() !== null);
  }

  logout() {
    // Logic to handle logout
    this.isAuthenticated.set(false);
    this.userState.resetState();
    this.resumeState.resetState();
    this.storageService.clear();
    this.router.navigateByUrl(AppRoutes.SIGNIN);
  }

}
