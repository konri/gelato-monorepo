import type { ReactNode } from 'react';

type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Right side of the header. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: 'default' | 'danger';
};

/** White section card used by the form and profile pages. */
export function Card({ title, description, actions, children, className = '', tone = 'default' }: CardProps) {
  return (
    <section
      className={`rounded-xl border bg-white p-6 ${tone === 'danger' ? 'border-red-200' : 'border-gray-200'} ${className}`}
    >
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className={`text-base font-semibold ${tone === 'danger' ? 'text-red-700' : 'text-gray-900'}`}>
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Back link above the title. */
  back?: ReactNode;
};

export function PageHeader({ title, subtitle, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
