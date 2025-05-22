import type { SVGProps } from 'react';

export function BatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 8.5L18 5s1-1.5-1-3.5-3.5-1-3.5-1L10 4" />
      <path d="m10 4 5 5" />
      <path d="M6.5 11.5L3 15s-1 1.5 1 3.5 3.5 1 3.5 1L11 16" />
      <path d="m11 16-5-5" />
    </svg>
  );
}
