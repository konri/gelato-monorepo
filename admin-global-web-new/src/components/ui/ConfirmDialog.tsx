import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { Alert } from './Alert';

type ConfirmDialogProps = {
  title: ReactNode;
  body?: ReactNode;
  confirmLabel: ReactNode;
  /** Danger styles the confirm button red. */
  tone?: 'default' | 'danger';
  busy?: boolean;
  error?: string | null;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = 'default',
  busy = false,
  error,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      busy={busy}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={busy}>
            {t('Common.cancel')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={busy}
            loadingText={t('Common.saving')}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      {body && <div className="text-sm text-gray-600">{body}</div>}
      {children}
    </Modal>
  );
}
