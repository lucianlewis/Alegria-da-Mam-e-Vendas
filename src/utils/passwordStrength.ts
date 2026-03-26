import zxcvbn from 'zxcvbn';

export interface PasswordCheck {
  score: 0 | 1 | 2 | 3 | 4;  // 0=fraca, 4=muito forte
  feedback: string[];
  isAcceptable: boolean;
}

export function checkPassword(password: string): PasswordCheck {
  const result = zxcvbn(password);
  return {
    score: result.score as 0|1|2|3|4,
    feedback: [
      ...(result.feedback.warning ? [result.feedback.warning] : []),
      ...result.feedback.suggestions,
    ],
    isAcceptable: result.score >= 3, // mínimo "forte"
  };
}

// Regras mínimas complementares ao zxcvbn:
export function validatePasswordRules(pwd: string): string[] {
  const errors: string[] = [];
  if (pwd.length < 10)            errors.push('Mínimo 10 caracteres');
  if (!/[A-Z]/.test(pwd))         errors.push('Pelo menos 1 letra maiúscula');
  if (!/[a-z]/.test(pwd))         errors.push('Pelo menos 1 letra minúscula');
  if (!/[0-9]/.test(pwd))         errors.push('Pelo menos 1 número');
  if (!/[^A-Za-z0-9]/.test(pwd))  errors.push('Pelo menos 1 caractere especial');
  return errors;
}
