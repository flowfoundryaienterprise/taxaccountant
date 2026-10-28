"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface BaseFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Shows a live "n / max" counter and warns before the limit is passed. */
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Label, hint, control, counter and inline error, wired together once.
 *
 * Accessibility contract, applied identically by every CMS form:
 *  - the label is always visible and always `htmlFor`-bound; placeholders
 *    are examples, never labels (DESIGN.md section 8);
 *  - required fields carry a visible marker *and* `aria-required`, not
 *    colour alone;
 *  - the error and the hint are referenced by `aria-describedby`, so a
 *    screen reader hears them with the field rather than in isolation;
 *  - `aria-invalid` flips with the error, and the message is `role="alert"`
 *    so it is announced when it appears.
 */
function FieldFrame({
  id,
  label,
  hint,
  error,
  required,
  maxLength,
  value,
  children,
  className,
}: Omit<BaseFieldProps, "onChange" | "value"> & {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const overLimit = maxLength !== undefined && value.length > maxLength;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-compact font-medium text-navy">
          {label}
          {required ? (
            <>
              <span aria-hidden className="ml-0.5 text-danger">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </label>

        {maxLength !== undefined ? (
          <span
            className={cn(
              "text-caption tabular-nums",
              overLimit ? "font-semibold text-danger" : "text-slate",
            )}
          >
            {value.length} / {maxLength}
          </span>
        ) : null}
      </div>

      {children}

      {hint ? (
        <p id={hintId} className="text-caption text-slate">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-caption font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-input border bg-white px-3 py-2.5 text-compact text-navy placeholder:text-slate disabled:cursor-not-allowed disabled:bg-tint/50 disabled:text-slate";

export function AdminTextField({
  placeholder,
  ...props
}: BaseFieldProps & { placeholder?: string }) {
  const { id, value, onChange, error, hint, disabled, required } = props;

  return (
    <FieldFrame {...props}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
          undefined
        }
        /*
         * No `maxLength` attribute on purpose: a hard cap silently truncates
         * a paste. The counter plus the validation message explain the limit
         * instead, so the editor can see what needs cutting.
         */
        className={cn(
          controlClass,
          error ? "border-danger" : "border-control focus-visible:border-action",
        )}
      />
    </FieldFrame>
  );
}

export function AdminTextArea({
  rows = 4,
  placeholder,
  ...props
}: BaseFieldProps & { rows?: number; placeholder?: string }) {
  const { id, value, onChange, error, hint, disabled, required } = props;

  return (
    <FieldFrame {...props}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
          undefined
        }
        className={cn(
          controlClass,
          "resize-y",
          error ? "border-danger" : "border-control focus-visible:border-action",
        )}
      />
    </FieldFrame>
  );
}

export function AdminSelectField({
  options,
  ...props
}: BaseFieldProps & { options: { value: string; label: string }[] }) {
  const { id, value, onChange, error, hint, disabled, required } = props;

  return (
    <FieldFrame {...props}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
          undefined
        }
        className={cn(
          controlClass,
          "h-11 py-0",
          error ? "border-danger" : "border-control focus-visible:border-action",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
