const AUTH_ERROR_MESSAGES = {
  // Login
  NotAuthorizedException: 'Correo o contraseña incorrectos.',
  UserNotFoundException: 'No existe una cuenta con este correo.',
  UserNotConfirmedForLoginException:
    'Tu correo aún no está verificado. Revisa tu bandeja para confirmarlo.',
  EmailNotConfirmedException:
    'Tu correo aún no está verificado. Revisa tu bandeja para confirmarlo.',
  LocalProfileNotFoundException:
    'Aún no completaste el registro. Vuelve a registrarte para continuar.',
  PasswordResetRequiredException:
    'Necesitas restablecer tu contraseña antes de iniciar sesión.',

  // Registro / contraseña
  UsernameExistsException: 'Ya existe una cuenta con este correo.',
  InvalidPasswordException:
    'La contraseña no cumple con los requisitos mínimos de seguridad.',
  InvalidParameterException: 'Los datos enviados no son válidos. Revisa el formulario.',

  // Códigos de verificación
  CodeMismatchException: 'El código no es válido. Verifica e inténtalo de nuevo.',
  ExpiredCodeException: 'El código expiró. Solicita uno nuevo.',
  CodeDeliveryFailureException:
    'No pudimos enviar el código. Inténtalo de nuevo en unos momentos.',

  // Rate limiting / disponibilidad
  TooManyRequestsException:
    'Demasiados intentos. Espera unos minutos antes de volver a intentar.',
  TooManyFailedAttemptsException:
    'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.',
  LimitExceededException:
    'Demasiados intentos. Espera unos minutos antes de volver a intentar.',

  // Cuenta
  UserDisabledException: 'Tu cuenta está deshabilitada. Contacta al administrador.',
};

export function getAuthErrorMessage(err, fallback = 'Algo salió mal. Inténtalo de nuevo.') {
  const data = err?.response?.data;
  const code = data?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  return data?.detail || data?.message || fallback;
}

export default AUTH_ERROR_MESSAGES;
