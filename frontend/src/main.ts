import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { errorInterceptor } from './app/core/error.interceptor';

bootstrapApplication(AppComponent, { providers: [provideRouter(routes), provideHttpClient(withInterceptors([errorInterceptor]))] })
  .catch((error: unknown) => {
    console.error('Falha ao iniciar a aplicação Angular:', error);
    document.body.innerHTML = '<main style="padding:2rem;font-family:sans-serif"><h1>Não foi possível iniciar a aplicação</h1><p>Consulte o terminal do Angular e tente reiniciar o projeto.</p></main>';
  });
