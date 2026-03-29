"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {
  type?: "text" | "email" | "url";
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {
  options: string[];
}

export function InputField({ label, error, required, ...props }: InputFieldProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function TextareaField({ label, error, required, ...props }: TextareaFieldProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <textarea
        {...props}
        rows={4}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function SelectField({ label, error, required, options, ...props }: SelectFieldProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <select
        {...props}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
      >
        <option value="">Seçiniz</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
