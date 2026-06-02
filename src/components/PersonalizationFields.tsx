'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CartPersonalization } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

// Shape the product page resolves from `product.personalizations` (option populated at depth 2)
// and hands to the panel. Price modifiers are already resolved server-side semantics (override
// ?? library), but remain advisory — the checkout recomputes them authoritatively.
export type PdpPersonalization = {
  optionId: number
  label: string
  inputType: 'text' | 'textarea' | 'choice' | 'color' | 'file'
  helpText?: string | null
  maxChars?: number | null
  required: boolean
  basePriceModifier: number
  presentation?: 'dropdown' | 'radio' | 'swatch' | null
  choices?: { label: string; value: string; priceModifier: number }[]
  fileConfig?: { allowedTypes: string[]; maxSizeMB: number; uploadInstructions?: string | null } | null
}

export type PersonalizationState = {
  personalizations: CartPersonalization[]
  valid: boolean
  priceDelta: number
}

type FileEntry = {
  status: 'idle' | 'uploading' | 'done' | 'error'
  fileRef?: { uploadId: number; url: string; filename: string; originalName: string }
  error?: string
}

type Props = {
  productId: number
  options: PdpPersonalization[]
  onChange: (state: PersonalizationState) => void
}

const EXT_LABEL: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/svg+xml': 'SVG',
  'application/pdf': 'PDF',
}

export function PersonalizationFields({ productId, options, onChange }: Props) {
  // Raw per-option input: text/color value, chosen choice value, or file upload entry.
  const [values, setValues] = useState<Record<number, string>>({})
  const [files, setFiles] = useState<Record<number, FileEntry>>({})

  const isProvided = useCallback(
    (opt: PdpPersonalization): boolean => {
      if (opt.inputType === 'file') return files[opt.optionId]?.status === 'done'
      return (values[opt.optionId] ?? '').trim().length > 0
    },
    [values, files],
  )

  // Derive the cart-shaped personalization array + validity + price delta, and report up.
  // Keyed on the raw state so this fires only on real input changes (no render loop).
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    const personalizations: CartPersonalization[] = []
    let priceDelta = 0
    let valid = true

    for (const opt of options) {
      const provided = isProvided(opt)
      if (opt.required && !provided) valid = false

      if (opt.inputType === 'file') {
        const entry = files[opt.optionId]
        if (entry?.status === 'uploading' || entry?.status === 'error') valid = false
        if (entry?.status === 'done' && entry.fileRef) {
          priceDelta += opt.basePriceModifier
          personalizations.push({
            optionId: opt.optionId,
            label: opt.label,
            inputType: 'file',
            fileRef: entry.fileRef,
            priceModifier: opt.basePriceModifier,
          })
        }
        continue
      }

      const raw = (values[opt.optionId] ?? '').trim()
      if (!raw) continue

      if (opt.inputType === 'choice') {
        const choice = opt.choices?.find((c) => c.value === raw)
        if (!choice) {
          valid = false
          continue
        }
        priceDelta += choice.priceModifier
        personalizations.push({
          optionId: opt.optionId,
          label: opt.label,
          inputType: 'choice',
          value: choice.value,
          choiceLabel: choice.label,
          priceModifier: choice.priceModifier,
        })
        continue
      }

      // text / textarea / color
      if ((opt.inputType === 'text' || opt.inputType === 'textarea') && opt.maxChars && raw.length > opt.maxChars) {
        valid = false
      }
      priceDelta += opt.basePriceModifier
      personalizations.push({
        optionId: opt.optionId,
        label: opt.label,
        inputType: opt.inputType,
        value: raw,
        priceModifier: opt.basePriceModifier,
      })
    }

    onChangeRef.current({ personalizations, valid, priceDelta })
  }, [values, files, options, isProvided])

  async function handleFile(opt: PdpPersonalization, file: File | undefined) {
    if (!file) return
    const cfg = opt.fileConfig
    // Client-side pre-check (server re-validates authoritatively).
    if (cfg?.maxSizeMB && file.size > cfg.maxSizeMB * 1024 * 1024) {
      setFiles((f) => ({ ...f, [opt.optionId]: { status: 'error', error: `File exceeds ${cfg.maxSizeMB} MB.` } }))
      return
    }
    setFiles((f) => ({ ...f, [opt.optionId]: { status: 'uploading' } }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('productId', String(productId))
      fd.append('optionId', String(opt.optionId))
      const res = await fetch('/api/personalization/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setFiles((f) => ({
        ...f,
        [opt.optionId]: {
          status: 'done',
          fileRef: {
            uploadId: data.uploadId,
            url: data.url,
            filename: data.filename,
            originalName: data.originalName ?? file.name,
          },
        },
      }))
    } catch (e) {
      setFiles((f) => ({
        ...f,
        [opt.optionId]: { status: 'error', error: e instanceof Error ? e.message : 'Upload failed' },
      }))
    }
  }

  if (options.length === 0) return null

  return (
    <div className="mt-8 space-y-6">
      <p className="text-xs uppercase tracking-wider text-ink-muted">Personalization</p>
      {options.map((opt) => {
        const modifierBadge = (mod: number) =>
          mod > 0 ? <span className="text-ink-muted"> (+{formatPrice(mod)})</span> : null

        return (
          <div key={opt.optionId}>
            <label className="block text-sm mb-2">
              {opt.label}
              {opt.required && <span className="text-copper"> *</span>}
              {opt.inputType !== 'choice' && modifierBadge(opt.basePriceModifier)}
            </label>

            {opt.inputType === 'text' && (
              <TextField opt={opt} value={values[opt.optionId] ?? ''} onChange={(v) => setValues((s) => ({ ...s, [opt.optionId]: v }))} />
            )}

            {opt.inputType === 'textarea' && (
              <TextField opt={opt} textarea value={values[opt.optionId] ?? ''} onChange={(v) => setValues((s) => ({ ...s, [opt.optionId]: v }))} />
            )}

            {opt.inputType === 'color' && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={values[opt.optionId] || '#b87333'}
                  onChange={(e) => setValues((s) => ({ ...s, [opt.optionId]: e.target.value }))}
                  className="w-12 h-10 border border-warm-mid cursor-pointer bg-transparent p-0.5"
                  aria-label={opt.label}
                />
                <span className="text-sm text-ink-muted tabular-nums">{values[opt.optionId] || '—'}</span>
              </div>
            )}

            {opt.inputType === 'choice' && (
              <ChoiceField
                opt={opt}
                value={values[opt.optionId] ?? ''}
                onChange={(v) => setValues((s) => ({ ...s, [opt.optionId]: v }))}
              />
            )}

            {opt.inputType === 'file' && (
              <FileField opt={opt} entry={files[opt.optionId]} onSelect={(file) => handleFile(opt, file)} extLabel={EXT_LABEL} />
            )}

            {opt.helpText && <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{opt.helpText}</p>}
          </div>
        )
      })}
    </div>
  )
}

function TextField({
  opt,
  value,
  onChange,
  textarea = false,
}: {
  opt: PdpPersonalization
  value: string
  onChange: (v: string) => void
  textarea?: boolean
}) {
  const over = opt.maxChars ? value.length > opt.maxChars : false
  const common =
    'w-full border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-dark transition-colors'
  const border = over ? 'border-red-600' : 'border-warm-mid'
  return (
    <div>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          maxLength={opt.maxChars ? opt.maxChars + 20 : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${common} ${border} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          maxLength={opt.maxChars ? opt.maxChars + 20 : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${common} ${border}`}
        />
      )}
      {opt.maxChars != null && (
        <p className={`text-xs mt-1 text-right tabular-nums ${over ? 'text-red-600' : 'text-ink-muted'}`}>
          {value.length}/{opt.maxChars}
        </p>
      )}
    </div>
  )
}

function ChoiceField({
  opt,
  value,
  onChange,
}: {
  opt: PdpPersonalization
  value: string
  onChange: (v: string) => void
}) {
  const choices = opt.choices ?? []
  const presentation = opt.presentation ?? 'dropdown'
  const label = (c: { label: string; priceModifier: number }) =>
    c.priceModifier > 0 ? `${c.label} (+${formatPrice(c.priceModifier)})` : c.label

  if (presentation === 'dropdown') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-warm-mid bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-dark cursor-pointer"
      >
        <option value="">Select…</option>
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {label(c)}
          </option>
        ))}
      </select>
    )
  }

  // radio / swatch both render as selectable chips (swatch is a visual variant).
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((c) => {
        const selected = c.value === value
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(selected ? '' : c.value)}
            className={[
              'px-4 py-2 text-sm border transition-colors cursor-pointer',
              selected ? 'border-dark bg-dark text-warm' : 'border-warm-mid hover:border-dark',
            ].join(' ')}
            aria-pressed={selected}
          >
            {label(c)}
          </button>
        )
      })}
    </div>
  )
}

function FileField({
  opt,
  entry,
  onSelect,
  extLabel,
}: {
  opt: PdpPersonalization
  entry: FileEntry | undefined
  onSelect: (file: File | undefined) => void
  extLabel: Record<string, string>
}) {
  const cfg = opt.fileConfig
  const accept = (cfg?.allowedTypes ?? []).join(',')
  const typesLabel = (cfg?.allowedTypes ?? []).map((t) => extLabel[t] ?? t).join(', ')
  const status = entry?.status ?? 'idle'

  return (
    <div>
      <label className="mt-1.5 inline-flex items-center gap-3 px-4 py-2.5 border border-warm-mid hover:border-dark transition-colors cursor-pointer text-sm">
        <span>{status === 'done' ? 'Replace file' : status === 'uploading' ? 'Uploading…' : 'Choose file'}</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={status === 'uploading'}
          onChange={(e) => onSelect(e.target.files?.[0])}
        />
      </label>
      <p className="text-xs text-ink-muted mt-3">
        {typesLabel}
        {cfg?.maxSizeMB ? ` · up to ${cfg.maxSizeMB} MB` : ''}
      </p>
      {cfg?.uploadInstructions && (
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{cfg.uploadInstructions}</p>
      )}
      {status === 'done' && entry?.fileRef && (
        <p className="text-xs text-copper mt-1.5 truncate">✓ {entry.fileRef.originalName} uploaded</p>
      )}
      {status === 'error' && entry?.error && <p className="text-xs text-red-600 mt-1.5">{entry.error}</p>}
    </div>
  )
}
