import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)}
  >
    <circle cx="50" cy="50" r="50" fill="currentColor" />
    <path
      d="M75.34 60.32a24.18 24.18 0 0 1-13.06 18.52l-3.64-8.3a16.14 16.14 0 0 0 8.7-12.36h8Z"
      fill="#fff"
    />
    <path
      d="M24.66 39.68a24.18 24.18 0 0 1 13.06-18.52l3.64 8.3a16.14 16.14 0 0 0-8.7 12.36h-8Z"
      fill="#fff"
    />
    <path
      d="M62.61 27.5a24.18 24.18 0 0 1 8.74 3.7l-5.62 6.8a16.14 16.14 0 0 0-5.83-2.47v-8.03Z"
      fill="#fff"
    />
    <path
      d="M37.39 72.5a24.18 24.18 0 0 1-8.74-3.7l5.62-6.8a16.14 16.14 0 0 0 5.83 2.47v8.03Z"
      fill="#fff"
    />
    <path
      d="M48.71 58.71h-18.4V41.29h12.5a8.71 8.71 0 1 1 0 17.42Z"
      fill="#fff"
    />
    <path
      d="M51.29 58.71h16.3v-2.92h-8.71V44.21h8.71v-2.92h-16.3v17.42Z"
      fill="#fff"
    />
  </svg>
);
