export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-3xl sm:max-w-5xl lg:max-w-7xl px-4 sm:px-6 lg:px-10 ${className}`}
    >
      {children}
    </div>
  );
}
