import { BaseIcon } from "@/ui/components/base/BaseIcon";

interface SaleFabButtonProps {
  onAdd?: () => void;
  onDelete?: () => void;
  disabledDelete?: boolean;
  hidden?: boolean;
}

/**
 * Sales are immutable (no edit) — only create and void (delete). Kept visually
 * consistent with the other modules' FAB.
 */
export function SaleFabButton({
  onAdd,
  onDelete,
  disabledDelete = false,
  hidden = false,
}: SaleFabButtonProps) {
  if (hidden) return null;
  return (
    <div className="fab fab-flower">
      <div tabIndex={0} role="button" className="btn btn-circle btn-lg">
        <BaseIcon icon="settings" size={24} color="currentColor" viewBox="0 0 24 24" />
      </div>

      <button className="fab-main-action btn btn-circle btn-lg btn-primary">
        <BaseIcon icon="close" size={24} color="currentColor" viewBox="0 0 24 24" />
      </button>

      <button className="btn btn-circle btn-lg btn-success" onClick={onAdd}>
        <BaseIcon icon="plus" size={24} color="currentColor" />
      </button>
      <button
        className="btn btn-circle btn-lg btn-error"
        onClick={onDelete}
        disabled={disabledDelete}
        title="Anular venta seleccionada"
      >
        <BaseIcon icon="trash" size={24} color="currentColor" viewBox="0 0 24 24" />
      </button>
    </div>
  );
}
