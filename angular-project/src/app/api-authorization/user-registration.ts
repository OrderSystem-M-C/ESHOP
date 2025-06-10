export interface UserRegistration {
  email: string,
  password: string,
  confirmPassword: string
}
export interface RegistrationResponse {
  isSuccessfulRegistration: boolean;
  errors: string[];
}
export interface UserLogin {
  email: string;
  password: string;
  recaptchaResponse: string;
}
export interface UserLoginResponse {
  isAuthSuccessful: boolean;
  errorMessage: string;
  token: string;
  username: string;
}
