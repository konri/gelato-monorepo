/** Brand logo, or its initial on a tinted square when there is none. */
export function BrandLogo({
  name,
  logoUrl,
  size = 'md',
}: {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-14 w-14 text-xl' }[size];
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={`${box} shrink-0 rounded-lg border border-gray-100 object-cover`} />;
  }
  return (
    <span
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center rounded-lg bg-brand-light font-bold text-brand`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
