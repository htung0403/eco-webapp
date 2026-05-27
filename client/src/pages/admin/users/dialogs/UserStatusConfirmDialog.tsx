import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import type { ConfirmDialogState } from '../../../../components/ui/ConfirmDialog';
export default function UserStatusConfirmDialog({ dialog, onClose }: { dialog: ConfirmDialogState; onClose: () => void }) { return <ConfirmDialog dialog={dialog} onClose={onClose} />; }
