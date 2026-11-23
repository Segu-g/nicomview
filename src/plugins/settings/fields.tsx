interface FieldProps {
  label: string
  value: string | number
  onChange: (value: string | number) => void
}

/** 空欄は空文字（未指定）として扱う */
export function NumberField({ label, value, onChange, ...range }: FieldProps & {
  min?: number
  max?: number
  step?: number
}): JSX.Element {
  return (
    <label className="settings-label">
      {label}
      <input
        type="number"
        {...range}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || '')}
      />
    </label>
  )
}

export function SelectField({ label, value, options, onChange }: FieldProps & {
  options: { value: string; label: string }[]
}): JSX.Element {
  return (
    <label className="settings-label">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}
