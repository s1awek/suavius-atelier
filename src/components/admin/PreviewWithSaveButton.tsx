'use client'

import React, { useRef, useState } from 'react'
import {
  ExternalLinkIcon,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
  useLocale,
} from '@payloadcms/ui'
import { generatePreviewPath, type PreviewableCollection } from '@/lib/preview'

const PREVIEWABLE = new Set<string>(['products', 'collections', 'pages'])

const SKIP_KEY = 'suavius:skip-preview-confirm'

/**
 * Replacement for Payload's default Preview button. When the form has unsaved
 * edits, intercept the click and offer to auto-save as draft before opening
 * preview (otherwise Preview shows the last saved version, which is confusing).
 * A "Don't ask again" checkbox persists in localStorage so power users
 * skip the modal entirely after the first time.
 */
export const PreviewWithSaveButton: React.FC = () => {
  const { submit } = useForm()
  const modified = useFormModified()
  const { id, collectionSlug, data } = useDocumentInfo()
  const slug = typeof data?.slug === 'string' ? data.slug : null
  const previewURL =
    collectionSlug && PREVIEWABLE.has(collectionSlug) && slug
      ? generatePreviewPath(collectionSlug as PreviewableCollection, slug)
      : null
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()
  const { code: locale } = useLocale()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [skipNextTime, setSkipNextTime] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!previewURL) return null

  const openPreview = () => {
    window.open(previewURL, '_blank', 'noopener,noreferrer')
  }

  const saveDraftAndPreview = async () => {
    setSaving(true)
    try {
      if (collectionSlug) {
        const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`
        const action = `${apiRoute}/${collectionSlug}${id ? `/${id}` : ''}${search}`
        const method = id ? 'PATCH' : 'POST'
        await submit({
          action,
          method,
          overrides: { _status: 'draft' },
        })
      } else {
        await submit({ overrides: { _status: 'draft' } })
      }
      openPreview()
    } catch (err) {
      // Surface failures in the console; the toast from Payload's submit will
      // already cover the user-facing error.
      console.error('[PreviewWithSaveButton] failed to save draft:', err)
    } finally {
      setSaving(false)
      dialogRef.current?.close()
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    if (!modified) {
      openPreview()
      return
    }

    if (typeof window !== 'undefined' && window.localStorage.getItem(SKIP_KEY) === '1') {
      void saveDraftAndPreview()
      return
    }

    setSkipNextTime(false)
    dialogRef.current?.showModal()
  }

  const handleConfirm = () => {
    if (skipNextTime && typeof window !== 'undefined') {
      window.localStorage.setItem(SKIP_KEY, '1')
    }
    void saveDraftAndPreview()
  }

  const handleCancel = () => {
    dialogRef.current?.close()
  }

  return (
    <>
      <a
        href={previewURL}
        onClick={handleClick}
        className="preview-btn"
        id="preview-button"
        target="_blank"
        rel="noopener"
        aria-label="Preview"
        title="Preview (saves draft first if there are unsaved changes)"
      >
        <ExternalLinkIcon />
      </a>

      <dialog
        ref={dialogRef}
        style={{
          padding: 0,
          border: 'none',
          borderRadius: 6,
          maxWidth: 480,
          background: 'transparent',
        }}
      >
        <div
          style={{
            background: 'var(--theme-elevation-0, white)',
            color: 'var(--theme-elevation-1000, inherit)',
            padding: '1.5rem',
            borderRadius: 6,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
            fontFamily: 'inherit',
            minWidth: 360,
            border: '1px solid var(--theme-elevation-150, transparent)',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 600 }}>
            Save changes before preview?
          </h3>
          <p
            style={{
              margin: '0 0 1rem',
              fontSize: '1rem',
              lineHeight: 1.5,
              opacity: 0.9,
            }}
          >
            You have unsaved edits. Preview reads from the saved version, so without
            saving they won&apos;t appear. Save as draft now and open Preview?
          </p>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: '1.25rem',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={skipNextTime}
              onChange={(e) => setSkipNextTime(e.target.checked)}
            />
            Don&apos;t ask again — always save draft before preview
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn--style-secondary btn--size-small"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn btn--style-primary btn--size-small"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save draft & preview'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
