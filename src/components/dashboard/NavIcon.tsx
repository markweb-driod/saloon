const PATHS: Record<string, React.ReactNode> = {
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" strokeLinecap="round" />
    </>
  ),
  pos: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19M6 15h4" strokeLinecap="round" />
    </>
  ),
  inventory: (
    <>
      <path d="M3.5 8.5L12 4l8.5 4.5L12 13 3.5 8.5z" strokeLinejoin="round" />
      <path d="M3.5 8.5V16L12 20.5 20.5 16V8.5M12 13v7.5" strokeLinejoin="round" />
    </>
  ),
  staff: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 11.2c2.4.4 4 2.1 4.5 4.3" strokeLinecap="round" />
    </>
  ),
  customers: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-3.6 3.3-6.5 7.5-6.5s7.5 2.9 7.5 6.5" strokeLinecap="round" />
    </>
  ),
  orders: (
    <>
      <path d="M6 8.5h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20L6 8.5z" strokeLinejoin="round" />
      <path d="M9 8.5V6a3 3 0 0 1 6 0v2.5" strokeLinecap="round" />
    </>
  ),
  promotions: (
    <>
      <path d="M11.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v6.5L13 21l8-8-9.5-9.5z" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  messages: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 6.5l9 6.5 9-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  content: (
    <>
      <path d="M6 3.5h9l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
      <path d="M14.5 3.5V8H19M8 13h8M8 16.5h8" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="8.5" cy="7.5" r="3" />
      <path d="M2.8 19c0-3 2.5-5.2 5.7-5.2S14.2 16 14.2 19" strokeLinecap="round" />
      <path d="M16 4.2c1.6.5 2.7 2 2.7 3.7 0 1.8-1.2 3.3-2.9 3.8M17.8 13.6c2.1.7 3.5 2.7 3.5 5" strokeLinecap="round" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20.5V10M11 20.5V4M18 20.5v-7" strokeLinecap="round" />
      <path d="M2.5 20.5h19" strokeLinecap="round" />
    </>
  ),
};

export default function NavIcon({ name, className = "" }: { name: string; className?: string }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden
    >
      {path}
    </svg>
  );
}
