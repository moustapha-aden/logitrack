"use client";

import { useState } from "react";

export type Errors<T> = Partial<Record<keyof T, string>>;

/** Petit gestionnaire d'état de formulaire typé avec validation. */
export function useForm<T extends object>(initial: T, validate: (v: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors<T>>({});

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (onValid: (v: T) => void) => (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs = validate(values);
    const hasErrors = Object.values(errs).some(Boolean);
    setErrors(errs);
    if (!hasErrors) onValid(values);
  };

  return { values, errors, set, submit };
}

export const required = (v: unknown, msg = "Champ obligatoire") => (v === "" || v === null || v === undefined ? msg : undefined);
export const emailRule = (v: string) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Adresse e-mail invalide" : undefined);
export const positive = (v: number, msg = "Valeur positive requise") => (!Number.isFinite(v) || v <= 0 ? msg : undefined);
