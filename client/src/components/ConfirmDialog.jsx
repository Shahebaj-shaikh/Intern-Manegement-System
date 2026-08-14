import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', loading }) => (
  <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
    <p className="text-sm text-slate-600 mb-6">{message}</p>
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
);
