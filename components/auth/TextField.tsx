import { useId, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, ...input }: Props) {
  const id = useId();
  const descId = `${id}-desc`;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? descId : undefined}
        className={`mt-2 h-12 w-full rounded-md border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25 ${
          error ? "border-red-500/70" : "border-line"
        }`}
        {...input}
      />
      {(error || hint) && (
        <p id={descId} className={`mt-2 text-sm ${error ? "text-red-500" : "text-muted"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
