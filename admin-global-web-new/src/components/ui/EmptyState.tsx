import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`rounded-xl border border-dashed border-gray-300 p-10 text-center ${className}`}>
      <p className="font-medium text-gray-600">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
