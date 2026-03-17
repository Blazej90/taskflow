import { Injectable, signal, computed } from '@angular/core';

/**
 * Service for managing application theme (light/dark mode).
 *
 * Persists user preference in localStorage and applies theme to document.
 * Automatically detects system preference on first visit.
 *
 * @example
 * // Toggle theme
 * themeService.toggle()
 *
 * @example
 * // Check current theme
 * if (themeService.isDark()) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'taskflow-theme';

  /** Current theme: 'light' | 'dark' */
  readonly theme = signal<'light' | 'dark'>('light');

  /** True if dark mode is active */
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Load saved preference or detect system preference
    const saved = this.loadFromStorage();
    const initialTheme = saved ?? this.detectSystemPreference();
    this.theme.set(initialTheme);

    // Apply theme immediately
    this.applyTheme(initialTheme);

    // React to changes using effect would need injector, 
    // so we use a simple subscription pattern in component
  }

  /**
   * Toggles between light and dark mode.
   */
  toggle(): void {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    this.applyTheme(newTheme);
    this.saveToStorage(newTheme);
  }

  /**
   * Explicitly sets the theme.
   *
   * @param theme - 'light' or 'dark'
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    this.saveToStorage(theme);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }

  private loadFromStorage(): 'light' | 'dark' | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // localStorage might be disabled or unavailable
    }
    return null;
  }

  private saveToStorage(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      // localStorage might be disabled or unavailable
    }
  }

  private detectSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
