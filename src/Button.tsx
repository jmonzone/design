import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "default" | "primary" | "secondary" | "selected" | "confirm" | "deny" | "warning";
export type ButtonSize = "sm" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** "sm" for the default variant and "lg" for the rest, unless set. */
  size?: ButtonSize;
  /** A quieter look for an action that isn't the main one right now. */
  subdued?: boolean;
  /** A small badge after the label, e.g. the key that presses it. */
  hint?: ReactNode;
}

/** The shared button. Its look is all in styles.css (`.jd-button`); `style` still overrides it. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size, subdued = false, hint, className, children, ...rest },
  ref,
) {
  const classes = ["jd-button", `jd-button--${variant}`, `jd-button--${size ?? (variant === "default" ? "sm" : "lg")}`];
  if (subdued) classes.push("jd-button--subdued");
  if (className) classes.push(className);
  return (
    <button ref={ref} className={classes.join(" ")} {...rest}>
      {children}
      {hint ? <span className="jd-button__hint">{hint}</span> : null}
    </button>
  );
});
