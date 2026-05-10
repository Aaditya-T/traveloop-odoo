"use client";

import { useFormStatus } from "react-dom";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel, className, disabled, ...rest }: Props) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={disabled ?? pending} type="submit" {...rest}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
