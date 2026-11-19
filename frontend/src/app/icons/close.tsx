export function CloseIcon({
  className,
  ...props
}: {
  className?: string;
  size?: number;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="fill-current text-gray-600"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
    >
      <path d="M6.293 6.293a1 1 0 011.414 0L9 7.586l1.293-1.293a1 1 0 111.414 1.414L10.414 9l1.293 1.293a1 1 0 01-1.414 1.414L9 10.414l-1.293 1.293a1 1 0 01-1.414-1.414L7.586 9 6.293 7.707a1 1 0 010-1.414z" />
    </svg>
  );
}
