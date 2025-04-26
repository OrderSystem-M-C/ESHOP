import { inject, Inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrationResponse, UserLogin, UserLoginResponse, UserRegistration } from './user-registration';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private httpClient = inject(HttpClient);
  private jwtHelper = inject(JwtHelperService);

  authenticated = signal(this.isAuthenticated());
  admin = signal(this.isAdmin());

  constructor(@Inject('BASE_URL') private baseUrl: string, private router: Router) {  }

  registerUser(userData: UserRegistration): Observable<RegistrationResponse> {
    return this.httpClient.post<RegistrationResponse>(this.baseUrl + '/user/register', userData);
  }

  loginUser(userData: UserLogin): Observable<UserLoginResponse> {
    return this.httpClient.post<UserLoginResponse>(this.baseUrl + '/user/login', userData);
  }

  logout() {
    localStorage.removeItem("token");
    this.authenticated.set(false);
    this.router.navigate(['/login']);
  }

  storeUserCredentials(token: string, username: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    this.authenticated.set(true);
    this.admin.set(this.isAdmin());
  }

  private isAdmin(): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }
    const decodedToken = this.jwtHelper.decodeToken(localStorage.getItem('token'));
    return decodedToken['admin'] === 'true';
  }

  getCurrentUsername(): string {
    return this.isAuthenticated() ? localStorage.getItem('username') : null;
  }

  public isAuthenticated() {
    const token = localStorage.getItem('token');

    return token && !this.jwtHelper.isTokenExpired(token);
  }
}
