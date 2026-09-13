import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "brand" | "ghost" | "danger";

const base =
  "inline-flex h-12 min-w-12 items-center justify-center gap-2 whitespace-nowrap rounded-rs border px-5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-accent text-white active:bg-accent-ink",
  brand: "border-transparent bg-brand text-white active:bg-brand-ink",
  ghost: "border-line bg-surface text-ink active:bg-surface-2",
  danger: "border-transparent bg-danger text-white active:opacity-90",
};

export function buttonClass(variant: ButtonVariant = "ghost", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = "ghost", className = "", type = "button", children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
};

export function ButtonLink({ href, variant = "ghost", className = "", children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}
