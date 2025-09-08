import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './app/authentication/login/login.component';
import { JwtModule } from '@auth0/angular-jwt';
import { errorHandlerInterceptor } from './app/authentication/error-handler.interceptor';
import { jwtInterceptor } from './app/authentication/jwt.interceptor';
import { OrderFormComponent } from './app/order-form/order-form.component';
import { OrdersPageComponent } from './app/orders-page/orders-page.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authGuard } from './app/authentication/auth.guard';
import { OrderDetailsComponent } from './app/order-details/order-details.component';
import { ProductsPageComponent } from './app/products-page/products-page.component';
import { loggedInGuard } from './app/authentication/logged-in.guard';
import { PageNotFoundComponent } from './app/page-not-found/page-not-found.component';
import { EphSettingsComponent } from './app/eph-settings/eph-settings.component';
import { AnalyticsPageComponent } from './app/analytics-page/analytics-page.component';

export function getBaseUrl() {
  return 'https://web1244125.bsite.net/api';
}

export function tokenGetter() {
  return localStorage.getItem("token");
}

const providers = [
  { provide: 'BASE_URL', useFactory: getBaseUrl, deps: [] }
];

bootstrapApplication(AppComponent, {
    providers: [
      providers,
      importProvidersFrom(BrowserModule, JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: ['https://localhost:7186', 'https://web1244125.bsite.net'],
          disallowedRoutes: [],
        },
      })),
      provideAnimations(),
      provideHttpClient(withInterceptors([errorHandlerInterceptor, jwtInterceptor])),
      provideRouter([
        { path: '', redirectTo: 'orders-page', pathMatch: 'full'},
        { path: 'login', component: LoginComponent, canActivate: [loggedInGuard]},
        { path: 'order-form', component: OrderFormComponent, canActivate: [authGuard]},
        { path: 'order-form/:orderId', component: OrderFormComponent, canActivate: [authGuard] },
        { path: 'orders-page', component: OrdersPageComponent, canActivate: [authGuard]},
        { path: 'order-details/:orderId', component: OrderDetailsComponent, canActivate: [authGuard]},
        { path: 'products-page', component: ProductsPageComponent, canActivate: [authGuard]},
        { path: 'eph-settings', component: EphSettingsComponent, canActivate: [authGuard]},
        { path: 'analytics-page', component: AnalyticsPageComponent, canActivate: [authGuard]},
        { path: '**', component: PageNotFoundComponent}
      ]), provideAnimationsAsync()
    ]
})
  .catch(err => console.error(err));
