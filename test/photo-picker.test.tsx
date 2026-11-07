// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PhotoPicker } from '../src/features/attendance/components/PhotoPicker'

afterEach(() => cleanup())

describe('photo picker', () => {
  it('shows an Indonesian file state and passes the selected file to its feature', () => {
    const onSelect = vi.fn()
    const label = 'Foto bukti (JPEG, PNG, atau WebP; maks. 5 MB)'
    const { container, rerender } = render(
      <PhotoPicker id="test-photo" label={label} file={null} onSelect={onSelect} />,
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe(label)
    expect(screen.getByText('Belum ada foto dipilih')).toBeTruthy()

    const file = new File(['photo bytes'], 'bukti-wfh.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onSelect).toHaveBeenCalledWith(file)
    expect(input.value).toBe('')

    rerender(<PhotoPicker id="test-photo" label={label} file={file} onSelect={onSelect} />)
    expect(screen.getByText('bukti-wfh.png')).toBeTruthy()
  })

  it('disables file selection while upload is in progress', () => {
    const { container } = render(
      <PhotoPicker id="test-photo" label="Foto bukti" file={null} disabled onSelect={vi.fn()} />,
    )
    expect((container.querySelector('input[type="file"]') as HTMLInputElement).disabled).toBe(true)
    expect(container.querySelector('.photo-picker-surface')?.getAttribute('aria-disabled')).toBe(
      'true',
    )
  })
})
