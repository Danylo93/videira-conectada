import { z } from 'zod';
import { VALIDATION } from '@/constants';

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'E-mail é obrigatório')
  .email('E-mail inválido')
  .regex(VALIDATION.EMAIL_REGEX, 'Formato de e-mail inválido');

export const passwordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, `Senha deve ter pelo menos ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres`);

export const nameSchema = z
  .string()
  .min(1, 'Nome é obrigatório')
  .max(VALIDATION.MAX_NAME_LENGTH, `Nome deve ter no máximo ${VALIDATION.MAX_NAME_LENGTH} caracteres`)
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços');

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => !phone || VALIDATION.PHONE_REGEX.test(phone),
    'Formato de telefone inválido. Use (XX) XXXXX-XXXX'
  );

export const descriptionSchema = z
  .string()
  .max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Descrição deve ter no máximo ${VALIDATION.MAX_DESCRIPTION_LENGTH} caracteres`)
  .optional();

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// User validation schemas
export const userSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(['pastor', 'obreiro', 'discipulador', 'lider']),
});

export const memberSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
  type: z.enum(['member', 'frequentador']),
  liderId: z.string().min(1, 'Líder é obrigatório'),
});

// Cell report validation schemas
export const cellReportSchema = z.object({
  weekStart: z.date(),
  membersPresent: z.array(z.string()),
  visitorsPresent: z.array(z.string()),
  newMembers: z.array(z.string()),
  phase: z.enum(['Comunhão', 'Edificação', 'Evangelismo', 'Multiplicação']),
  observations: descriptionSchema,
});

// Event validation schemas
export const eventSchema = z.object({
  name: nameSchema,
  type: z.enum(['Encontro', 'Conferência', 'Imersão']),
  description: descriptionSchema,
  date: z.date(),
  location: z.string().min(1, 'Local é obrigatório'),
  maxCapacity: z.number().min(1).optional(),
});

// Course validation schemas
export const courseSchema = z.object({
  name: z.enum(['Maturidade no Espírito', 'CTL']),
  description: descriptionSchema,
  duration: z.string().min(1, 'Duração é obrigatória'),
  price: z.number().min(0).optional(),
});

// Utility functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function validateName(name: string): boolean {
  return nameSchema.safeParse(name).success;
}

// Form validation helpers
export function getFieldError(schema: z.ZodSchema, data: any, field: string): string | undefined {
  try {
    schema.parse(data);
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path.includes(field));
      return fieldError?.message;
    }
    return 'Erro de validação';
  }
}

export function validateForm(schema: z.ZodSchema, data: any): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  try {
    schema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Erro de validação' } };
  }
}
