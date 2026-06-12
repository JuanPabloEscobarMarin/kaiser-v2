import { BaseIcon } from "@/ui/components/base/BaseIcon";

interface Props {
  onAdd?: () => void;
  /** Omitir para entidades sin edición (p. ej. ventas, que son inmutables). */
  onEdit?: () => void;
  onDelete?: () => void;
  disabledEdit?: boolean;
  disabledDelete?: boolean;
  hidden?: boolean;
}

/**
 * FAB de acciones CRUD compartido por todos los managers de la admin.
 * Reemplaza a los seis *FabButton idénticos que existían por entidad.
 */
export function FabActions({
  onAdd,
  onEdit,
  onDelete,
  disabledEdit = false,
  disabledDelete = false,
  hidden = false,
}: Props) {
  if (hidden) return null;
  return (
    <div className="fab fab-flower">
      {/* a focusable div with tabIndex is necessary to work on all browsers. role="button" is necessary for accessibility */}
      <div tabIndex={0} role="button" className="btn btn-circle btn-lg">
        <BaseIcon
          icon="settings"
          size={24}
          color="currentColor"
          viewBox="0 0 24 24"
        />
      </div>

      {/* Main Action button replaces the original button when FAB is open */}
      <button className="fab-main-action btn btn-circle btn-lg btn-primary">
        <BaseIcon
          icon="close"
          size={24}
          color="currentColor"
          viewBox="0 0 24 24"
        />
      </button>

      {/* buttons that show up when FAB is open */}
      <button className="btn btn-circle btn-lg btn-success" onClick={onAdd}>
        <BaseIcon icon="plus" size={24} color="currentColor" />
      </button>
      {onEdit && (
        <button
          className="btn btn-circle btn-lg btn-warning"
          onClick={onEdit}
          disabled={disabledEdit}
        >
          <BaseIcon icon="edit" size={24} color="currentColor" />
        </button>
      )}
      <button
        className="btn btn-circle btn-lg btn-error"
        onClick={onDelete}
        disabled={disabledDelete}
      >
        <BaseIcon
          icon="trash"
          size={24}
          color="currentColor"
          viewBox="0 0 24 24"
        />
      </button>
    </div>
  );
}
