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
