/** Angled seam between two sections of differing background color. */
export default function SectionDivider({
  fill,
  flip = false,
}: {
  fill: string;
  flip?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`pointer-events-none block h-10 w-full sm:h-14 ${
        flip ? "-scale-y-100" : ""
      }`}
    >
      <path d="M0,0 L1440,34 L1440,60 L0,60 Z" fill={fill} />
    </svg>
  );
}
