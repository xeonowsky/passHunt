export function FormNotice({
  tone,
  children,
}: {
  tone: "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-500/40 bg-red-500/10 text-red-500"
          : "border-accent/40 bg-accent/10 text-foreground"
      }`}
    >
      {children}
    </div>
  );
}
