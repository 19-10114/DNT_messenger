interface TitleProps {
  children: React.ReactNode;
}
export function Title({ children }: TitleProps) {
  return <h1 className="font-semibold text-2xl">{children}</h1>;
}
