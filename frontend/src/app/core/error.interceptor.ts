import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    notifications.show(error.error?.message ?? 'Não foi possível concluir a operação.', 'error');
    return throwError(() => error);
  }));
};
