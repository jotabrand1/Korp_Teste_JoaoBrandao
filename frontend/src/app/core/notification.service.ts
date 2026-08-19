import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly message = signal<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  show(text: string, type: 'success' | 'error' | 'info' = 'info') {
    if (this.timer) clearTimeout(this.timer);
    this.message.set({ text, type });
    this.timer = setTimeout(() => { this.message.set(null); this.timer = undefined; }, 5000);
  }
}
