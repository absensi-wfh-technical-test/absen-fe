import { AppIcon } from '@/components/ui/AppIcon'

interface Props {
  id: string
  label: string
  file: File | null
  disabled?: boolean
  onSelect: (file: File | null) => void
}

export function PhotoPicker({ id, label, file, disabled = false, onSelect }: Props) {
  return (
    <div className="photo-picker">
      <label className="photo-picker-label" htmlFor={id}>
        {label}
      </label>
      <input
        className="photo-picker-input"
        id={id}
        type="file"
        aria-label={label}
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
      <label className="photo-picker-surface" htmlFor={id} aria-disabled={disabled}>
        <span className="photo-picker-action">
          <AppIcon name="camera" size={17} /> Pilih foto
        </span>
        <span className="photo-picker-name" aria-live="polite">
          {file?.name ?? 'Belum ada foto dipilih'}
        </span>
      </label>
    </div>
  )
}
