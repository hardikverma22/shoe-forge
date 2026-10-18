"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { X } from "lucide-react";

type Variant = "primary" | "outline" | "ghost" | "danger" | "select";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110 active:brightness-95",
  select: "bg-select text-select-ink hover:brightness-105",
  outline: "border border-line bg-surface text-ink hover:border-line-strong",
  ghost: "text-ink hover:bg-ink/6",
  danger: "bg-danger text-white hover:brightness-110",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }
>(function Button(
  { variant = "outline", size = "md", className = "", type = "button", ...props },
  ref,
) {
  const sizing =
    size === "sm"
      ? "h-8 px-3.5 text-[0.8125rem]"
      : size === "lg"
        ? "h-12 px-6 text-base"
        : "h-10 px-4 text-sm";
  return (
    <button
      ref={ref}
      type={type}
      {...props}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-[filter,border-color,background-color,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${sizing} ${variants[variant]} ${className}`}
    />
  );
});

export function IconButton({
  label,
  children,
  className = "",
  shortcut,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      {...props}
      className={`text-ink hover:bg-ink/6 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${className}`}
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
  size = "md",
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    for (let step = 1; step <= options.length; step++) {
      const next = options[(idx + dir * step + options.length * 2) % options.length]!;
      if (!next.disabled) {
        onChange(next.value);
        e.currentTarget.parentElement
          ?.querySelectorAll<HTMLButtonElement>("button")
          [options.indexOf(next)]?.focus();
        break;
      }
    }
  };
  const anySelected = options.some((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`bg-ink/6 inline-flex gap-0.5 rounded-full p-0.5 ${className}`}
    >
      {options.map((o, idx) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!anySelected && idx === 0) ? 0 : -1}
            disabled={o.disabled}
            title={o.title}
            onKeyDown={(e) => onKey(e, idx)}
            onClick={() => onChange(o.value)}
            className={`shrink-0 cursor-pointer rounded-full font-semibold whitespace-nowrap transition-colors duration-200 disabled:opacity-40 ${
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3.5 text-[0.8125rem]"
            } ${selected ? "bg-surface text-ink shadow-[0_1px_2px_rgb(10_10_18/0.12),0_4px_10px_-4px_rgb(10_10_18/0.18)]" : "text-ink-muted hover:text-ink"}`}
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
  hint,
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
  hint?: string;
}) {
  const id = `slider-${useId()}`;
  const end = (v: number) => onEnd?.(v);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={`space-y-2 ${disabled ? "opacity-45" : ""}`}>
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <span className="spec text-ink-muted">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onPointerDown={() => onStart?.(value)}
        onPointerUp={(e) => end(Number((e.target as HTMLInputElement).value))}
        onKeyDown={() => onStart?.(value)}
        onKeyUp={(e) => end(Number((e.target as HTMLInputElement).value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sf-range w-full cursor-pointer disabled:cursor-not-allowed"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-ink-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Native dialog. Gives focus trapping, Escape to close and the backdrop for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
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
      className={`m-auto mt-[12vh] ${wide ? "w-[min(94vw,40rem)]" : "w-[min(94vw,34rem)]"} border-line bg-surface text-ink rounded-2xl border p-0 shadow-[0_40px_80px_-30px_rgb(5_6_26/0.55)] open:animate-[dialog-in_260ms_var(--ease-out-expo)]`}
    >
      <div className="border-line flex items-center justify-between border-b py-3 pr-3 pl-5">
        <h2 className="display text-[1.75rem]">{title}</h2>
        <IconButton label="Close" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </IconButton>
      </div>
      <div className="max-h-[66dvh] overflow-y-auto p-5">{open ? children : null}</div>
    </dialog>
  );
}
