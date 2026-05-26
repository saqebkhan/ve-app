import { ref, reactive } from 'vue';

// ─── Validation Rule ──────────────────────────────────────────────────────────
export type ValidationRule<T> = {
  field: keyof T;
  message: string;
  validator: (value: unknown, form?: T) => boolean;
};

// ─── useForm Composable ───────────────────────────────────────────────────────
export const useForm = <T extends Record<string, unknown>>(
  initialValues: T,
  rules: ValidationRule<T>[]
) => {
  const form = reactive({ ...initialValues }) as T;
  const errors = ref<Partial<Record<keyof T, string>>>({});
  const isShaking = ref(false);

  const validate = (): boolean => {
    errors.value = {};
    let valid = true;

    for (const rule of rules) {
      if (!rule.validator(form[rule.field], form)) {
        if (!errors.value[rule.field]) {
          errors.value[rule.field] = rule.message;
        }
        valid = false;
      }
    }

    if (!valid) {
      triggerShake();
    }

    return valid;
  };

  const clearErrors = (): void => {
    errors.value = {};
  };

  const clearFieldError = (field: keyof T): void => {
    if (errors.value[field]) {
      delete errors.value[field];
    }
  };

  const resetForm = (): void => {
    Object.assign(form, initialValues);
    errors.value = {};
  };

  const triggerShake = (): void => {
    isShaking.value = true;
    setTimeout(() => {
      isShaking.value = false;
    }, 600);
  };

  const setFieldValue = (field: keyof T, value: unknown): void => {
    (form as Record<keyof T, unknown>)[field] = value;
  };

  return {
    form,
    errors,
    isShaking,
    validate,
    clearErrors,
    clearFieldError,
    resetForm,
    triggerShake,
    setFieldValue,
  };
};

// ─── Common Validators ────────────────────────────────────────────────────────
export const validators = {
  required: (value: unknown): boolean =>
    value !== null && value !== undefined && String(value).trim() !== '',

  email: (value: unknown): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),

  minLength: (min: number) => (value: unknown): boolean =>
    String(value).trim().length >= min,

  maxLength: (max: number) => (value: unknown): boolean =>
    String(value).trim().length <= max,

  positiveNumber: (value: unknown): boolean =>
    !isNaN(Number(value)) && Number(value) > 0,

  nonNegativeNumber: (value: unknown): boolean =>
    !isNaN(Number(value)) && Number(value) >= 0,

  alphanumericHyphen: (value: unknown): boolean =>
    /^[A-Za-z0-9\-]+$/.test(String(value)),

  passwordMatch: (password: string) => (value: unknown): boolean =>
    String(value) === password,

  minValue: (min: number) => (value: unknown): boolean =>
    !isNaN(Number(value)) && Number(value) >= min,
};
