import { forwardRef, useImperativeHandle, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { isTouchDevice, useKeyHandler } from "./keys";

export type ButtonVariant = "default" | "primary" | "secondary" | "selected" | "confirm" | "deny" | "warning";
export type ButtonSize = "sm" | "lg";

/** A key that presses a Button, and its badge. */
export interface ButtonHotkey {
  /** A `KeyboardEvent.key`, or several that each press it. */
  key: string | readonly string[];
  /** The badge, e.g. "ENTER". */
  label: string;
}

/** Each variant's hotkey, unless `hotkey` is set. */
const VARIANT_HOTKEYS: Partial<Record<ButtonVariant, ButtonHotkey>> = {
  confirm: { key: "Enter", label: "ENTER" },
  deny: { key: "Escape", label: "ESC" },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** "sm" for the default variant and "lg" for the rest, unless set. */
  size?: ButtonSize;
  /** A quieter look for an action that isn't the main one right now. */
  subdued?: boolean;
  /** The key that presses it while it has an `onClick` and isn't disabled: Enter for confirm, Escape for deny,
   * unless set. null for none. */
  hotkey?: ButtonHotkey | null;
  /** false keeps the badge but stops the key pressing it, e.g. while something else has the keyboard. */
  hotkeyEnabled?: boolean;
  /** A small badge after the label: the hotkey's (none while subdued), unless set. Touch screens never show it. */
  hint?: ReactNode;
}

/** The shared button. Its look is all in styles.css (`.jd-button`); `style` still overrides it. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size, subdued = false, hotkey, hotkeyEnabled = true, hint, className, children, ...rest },
  ref,
) {
  const self = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => self.current!, []);

  const key = hotkey === undefined ? VARIANT_HOTKEYS[variant] : hotkey;
  const keys = key ? (typeof key.key === "string" ? [key.key] : key.key) : [];
  const press = () => self.current?.click();
  useKeyHandler(Object.fromEntries(keys.map((k) => [k, press])), {
    enabled: hotkeyEnabled && !rest.disabled && !!rest.onClick,
  });
  const badge = isTouchDevice ? undefined : hint !== undefined ? hint : subdued ? undefined : key?.label;

  const classes = ["jd-button", `jd-button--${variant}`, `jd-button--${size ?? (variant === "default" ? "sm" : "lg")}`];
  if (subdued) classes.push("jd-button--subdued");
  if (className) classes.push(className);
  return (
    <button ref={self} className={classes.join(" ")} {...rest}>
      {children}
      {badge ? <span className="jd-button__hint">{badge}</span> : null}
    </button>
  );
});
