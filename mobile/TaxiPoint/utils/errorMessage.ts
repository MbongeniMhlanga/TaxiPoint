export type ApiErrorContext =
  | 'generic'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'profile'
  | 'taxi-ranks'
  | 'incidents'
  | 'admin';

const PASSWORD_GUIDANCE =
  'Your password must be at least 6 characters long and include a mix of letters and numbers.';

const friendlyFallback = (context: ApiErrorContext) => {
  switch (context) {
    case 'login':
      return 'Incorrect email or password. Please try again.';
    case 'register':
      return 'We could not create your account right now. Please check your details and try again.';
    case 'forgot-password':
      return 'We could not send the reset email right now. Please try again.';
    case 'reset-password':
      return 'We could not reset your password right now. Please try again.';
    case 'profile':
      return 'We could not update your profile right now. Please try again.';
    case 'taxi-ranks':
      return 'Taxi ranks could not be loaded right now. Please try again.';
    case 'incidents':
      return 'Incidents could not be loaded right now. Please try again.';
    case 'admin':
      return 'This action could not be completed right now. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

const extractServerMessage = (rawMessage?: unknown) => {
  if (!rawMessage) return '';

  if (typeof rawMessage === 'string') {
    const trimmed = rawMessage.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') return parsed;
      if (parsed?.message && typeof parsed.message === 'string') return parsed.message;
      if (parsed?.error && typeof parsed.error === 'string') return parsed.error;
      if (parsed?.detail && typeof parsed.detail === 'string') return parsed.detail;
    } catch {
      // Not JSON, fall through.
    }

    return trimmed;
  }

  if (rawMessage instanceof Error) {
    return rawMessage.message;
  }

  if (typeof rawMessage === 'object' && rawMessage !== null) {
    const maybeMessage = (rawMessage as { message?: unknown; error?: unknown; detail?: unknown }).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
    const maybeError = (rawMessage as { error?: unknown }).error;
    if (typeof maybeError === 'string') return maybeError;
    const maybeDetail = (rawMessage as { detail?: unknown }).detail;
    if (typeof maybeDetail === 'string') return maybeDetail;
  }

  return String(rawMessage);
};

const normalizeText = (text: string) => text.toLowerCase();

export function getErrorMessage(status: number, rawMessage?: string, context: ApiErrorContext = 'generic') {
  const serverMessage = extractServerMessage(rawMessage);
  const normalized = normalizeText(serverMessage);

  if (
    normalized.includes('bad credentials') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('wrong password') ||
    normalized.includes('incorrect password') ||
    normalized.includes('username or password')
  ) {
    return 'Incorrect email or password. Please try again.';
  }

  if (normalized.includes('aborted') || normalized.includes('aborterror')) {
    return 'The request took too long. Please try again.';
  }

  if (normalized.includes('network request failed') || normalized.includes('failed to fetch')) {
    return 'We could not connect to the server. Please check your internet connection.';
  }

  if (
    normalized.includes('already exist') ||
    normalized.includes('already exists') ||
    normalized.includes('duplicate') ||
    normalized.includes('unique') ||
    normalized.includes('constraint violation')
  ) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (
    normalized.includes('password') &&
    (normalized.includes('character') || normalized.includes('length') || normalized.includes('invalid') || normalized.includes('weak'))
  ) {
    return PASSWORD_GUIDANCE;
  }

  if (normalized.includes('expired') && normalized.includes('token')) {
    return 'This reset link has expired. Please request a new one.';
  }

  if (normalized.includes('not found')) {
    return 'We could not find that item right now. Please try again.';
  }

  if (normalized.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (normalized.includes('forbidden') || normalized.includes('csrf')) {
    return context === 'register' ? PASSWORD_GUIDANCE : 'You do not have permission to perform this action.';
  }

  switch (status) {
    case 400:
      return context === 'register'
        ? PASSWORD_GUIDANCE
        : 'Please check your details and try again.';
    case 401:
      return context === 'login'
        ? 'Incorrect email or password. Please try again.'
        : 'Your session has expired. Please sign in again.';
    case 403:
      return context === 'register'
        ? PASSWORD_GUIDANCE
        : 'You do not have permission to perform this action.';
    case 404:
      return context === 'forgot-password'
        ? 'We could not find an account with that email address.'
        : 'The requested service could not be found right now.';
    case 409:
      return context === 'register'
        ? 'An account with this email already exists. Please sign in instead.'
        : 'That record already exists.';
    case 422:
      return context === 'register'
        ? PASSWORD_GUIDANCE
        : 'Please review the details you entered and try again.';
    default:
      return status >= 500 ? 'We are having trouble on our side. Please try again in a moment.' : friendlyFallback(context);
  }
}

export function getNetworkErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('aborted') || message.includes('aborterror')) {
      return 'The request took too long. Please try again.';
    }
    if (message.includes('network request failed') || message.includes('failed to fetch')) {
      return 'We could not connect to the server. Please check your internet connection.';
    }
    return error.message;
  }

  return 'We could not connect to the server. Please check your internet connection.';
}

export function getValidationHint(context: ApiErrorContext) {
  if (context === 'register' || context === 'reset-password') {
    return PASSWORD_GUIDANCE;
  }

  return '';
}
