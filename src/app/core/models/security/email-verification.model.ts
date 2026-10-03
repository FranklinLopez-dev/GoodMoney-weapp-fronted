/** Respuesta de send-verification-code y verify-code. */
export interface EmailVerificationResponse {
  success: boolean;
  /** Mensaje ya redactado para el usuario cuando `success` es false. */
  error: string | null;
}
