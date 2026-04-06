import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { User } from '@core/models/user/user.model';
import { StorageService } from '@shared/services/storage.service';
import { ResumeState } from '@core/states/resume.state';
import { UserState } from '@core/states/user.state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly resumeState = inject(ResumeState);
  readonly userState = inject(UserState);

  /** Route constants for templates (nav links, fragments). */
  readonly appRoutes = AppRoutes;

  private readonly userMenuRoot = viewChild<ElementRef<HTMLElement>>('userMenuRoot');

  readonly userMenuOpen = signal(false);
  readonly mobileOpen = signal(false);

  /** Auth UI follows persisted user session (updates after login without full reload). */
  readonly isAuthenticated = computed(() => this.userState.isLoggedIn());

  readonly currentUser = this.userState.currentUser;

  readonly showPremiumChip = computed(() => this.currentUser()?.isPremium === true);

  readonly showNonPremiumChip = computed(() => {
    const u = this.currentUser();
    return !!u && !u.isPremium;
  });

  readonly nonPremiumChipLabel = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    if (u.isFreemium) return 'Freemium';
    return 'Guest';
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) return;
    const root = this.userMenuRoot()?.nativeElement;
    if (root?.contains(event.target as Node)) return;
    this.userMenuOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.userMenuOpen()) {
      this.userMenuOpen.set(false);
    }
    if (this.mobileOpen()) {
      this.mobileOpen.set(false);
    }
  }

  initials(fullName: string | undefined): string {
    if (!fullName?.trim()) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    return `${a}${b}`.toUpperCase();
  }

  shortDisplayName(fullName: string | undefined): string {
    if (!fullName?.trim()) return 'User';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
  }

  planSubtitle(user: User | null): string {
    if (!user) return '';
    if (user.isPremium) return 'Premium Plan';
    if (user.isFreemium) return 'Freemium';
    return 'Guest';
  }

  toggleUserMenu(event?: Event): void {
    event?.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  toggleMobile(event?: Event): void {
    event?.stopPropagation();
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  goToDashboardSection(section: 'profile' | 'usage' | 'settings'): void {
    const fragment =
      section === 'profile'
        ? 'dashboard-profile'
        : section === 'usage'
          ? 'dashboard-usage'
          : 'dashboard-settings';
    this.closeUserMenu();
    this.closeMobile();
    void this.router.navigate([AppRoutes.DASHBOARD], { fragment });
  }

  logout(): void {
    this.closeUserMenu();
    this.closeMobile();
    this.userState.resetState();
    this.resumeState.resetState();
    this.storageService.clear();
    void this.router.navigateByUrl(AppRoutes.SIGNIN);
  }
}
