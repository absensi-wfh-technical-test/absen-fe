import type { EmployeePayload, Lookup } from '../types'

interface Props {
  form: EmployeePayload
  editing: boolean
  departments: Lookup[]
  positions: Lookup[]
  fieldErrors: { employeeCode?: string; email?: string }
  onField: <K extends keyof EmployeePayload>(name: K, value: EmployeePayload[K]) => void
}

export function EmployeeFormFields({
  form,
  editing,
  departments,
  positions,
  fieldErrors,
  onField,
}: Props) {
  return (
    <>
      <div className="form-section-heading">
        <strong>Identitas karyawan</strong>
        <small>Data ini digunakan untuk profil dan akses masuk karyawan.</small>
      </div>
      <label>
        Kode karyawan
        <input
          required
          maxLength={30}
          value={form.employeeCode}
          aria-invalid={Boolean(fieldErrors.employeeCode)}
          aria-describedby={fieldErrors.employeeCode ? 'employee-code-error' : undefined}
          onChange={(event) => onField('employeeCode', event.target.value)}
        />
        {fieldErrors.employeeCode && (
          <span id="employee-code-error" className="field-error">
            {fieldErrors.employeeCode}
          </span>
        )}
      </label>
      <label>
        Nama lengkap
        <input
          required
          maxLength={150}
          value={form.fullName}
          onChange={(event) => onField('fullName', event.target.value)}
        />
      </label>
      <label>
        Email
        <input
          required
          type="email"
          value={form.email}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'employee-email-error' : undefined}
          onChange={(event) => onField('email', event.target.value)}
        />
        {fieldErrors.email && (
          <span id="employee-email-error" className="field-error">
            {fieldErrors.email}
          </span>
        )}
      </label>
      {!editing && (
        <label>
          Kata sandi awal
          <input
            required
            type="password"
            minLength={8}
            value={form.initialPassword ?? ''}
            onChange={(event) => onField('initialPassword', event.target.value)}
            autoComplete="new-password"
          />
        </label>
      )}
      <div className="form-section-heading">
        <strong>Informasi organisasi</strong>
        <small>Pilih departemen dan jabatan yang aktif, lalu lengkapi data opsional.</small>
      </div>
      <label>
        Departemen
        <select
          required
          value={form.departmentId || ''}
          onChange={(event) => onField('departmentId', Number(event.target.value))}
        >
          <option value="">Pilih departemen</option>
          {departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Jabatan
        <select
          required
          value={form.positionId || ''}
          onChange={(event) => onField('positionId', Number(event.target.value))}
        >
          <option value="">Pilih jabatan</option>
          {positions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nomor telepon (opsional)
        <input
          value={form.phoneNumber ?? ''}
          onChange={(event) => onField('phoneNumber', event.target.value || null)}
        />
      </label>
      <label>
        Tanggal bergabung (opsional)
        <input
          type="date"
          value={form.hireDate ?? ''}
          onChange={(event) => onField('hireDate', event.target.value || null)}
        />
      </label>
    </>
  )
}
