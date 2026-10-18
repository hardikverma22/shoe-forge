"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, useEffect, useId, useRef } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110",
  outline: "border border-line bg-surface text-ink hover:border-accent",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-danger text-white hover:brightness-110",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }>(
  function Button({ variant = "outline", size = "md", className = "", ...props }, ref) {
    const sizing = size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm";
    return (
      <button
        ref={ref}
        {...props}
        className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-[filter,border-color,background-color] duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${sizing} ${variants[variant]} ${className}`}
      />
    );
  },
);

export function IconButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`grid size-9 place-items-center rounded-[var(--radius-control)] transition-colors hover:bg-ink/5 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/** Radio-style segmented control. Keyboard: arrow keys move the selection. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    for (let step = 1; step <= options.length; step++) {
      const next = options[(idx + dir * step + options.length * 2) % options.length]!;
      if (!next.disabled) {
        onChange(next.value);
        (e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[options.indexOf(next)])?.focus();
        break;
      }
    }
  };
  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((o, idx) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={o.disabled}
            title={o.title}
            onKeyDown={(e) => onKey(e, idx)}
            onClick={() => onChange(o.value)}
            className={`h-9 rounded-[var(--radius-control)] border px-3 text-sm font-medium transition-colors disabled:opacity-40 ${
              selected ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:border-accent"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  onStart,
  onEnd,
  format,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: (v: number) => void;
  onEnd?: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const id = `slider-${useId()}`;
  const end = (v: number) => onEnd?.(v);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <span className="tabular text-ink-muted">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onPointerDown={() => onStart?.(value)}
        onPointerUp={(e) => end(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => end(Number((e.target as HTMLInputElement).value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)] disabled:opacity-40"
      />
    </div>
  );
}

/** Native dialog. Gives focus trapping, Escape to close and the backdrop for free. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,34rem)] rounded-[var(--radius-panel)] border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/30"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        <IconButton label="Close" onClick={onClose}>
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        </IconButton>
      </div>
      <div className="max-h-[70dvh] overflow-y-auto p-5">{open ? children : null}</div>
    </dialog>
  );
}
