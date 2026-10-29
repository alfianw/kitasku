'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  KeyRound,
  LayoutDashboard,
  Link2,
  List,
  ListOrdered,
  LogOut,
  Menu,
  Newspaper,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
  Unlink,
  X,
} from 'lucide-react'
import {
  ApiError,
  changePassword,
  clearToken,
  deleteContent,
  fetchContent,
  hasToken,
  login,
  saveContent,
  uploadImage,
  type Content,
  type ContentForm,
  type ContentType,
} from '@/lib/api'

type Section = ContentType | 'dashboard'

const emptyForm: ContentForm = {
  contentType: 'gallery',
  title: '',
  excerpt: '',
  body: '',
  imageUrl: '',
  status: 'published',
}

const sections: { type: ContentType; label: string; description: string; icon: typeof ImageIcon }[] = [
  { type: 'gallery', label: 'Gallery', description: 'Manage images shown in the gallery lightbox.', icon: ImageIcon },
  { type: 'news', label: 'News', description: 'Manage article previews and full stories.', icon: Newspaper },
]

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export default function CmsPage() {
  const [items, setItems] = useState<Content[]>([])
  const [section, setSection] = useState<Section>('dashboard')
  const [editing, setEditing] = useState<Content | null>(null)
  const [form, setForm] = useState<ContentForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Content | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3500)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchContent()
      setItems(data)
      setAuthenticated(true)
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        setAuthenticated(false)
      } else {
        setError(errorMessage(err))
      }
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (hasToken()) {
      void load()
    } else {
      setChecking(false)
    }
  }, [load])

  const counts = useMemo(
    () => ({
      gallery: items.filter((item) => item.contentType === 'gallery').length,
      news: items.filter((item) => item.contentType === 'news').length,
    }),
    [items],
  )

  const visible = section === 'dashboard' ? items : items.filter((item) => item.contentType === section)
  const activeSection = sections.find((item) => item.type === section)

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    try {
      await login(username.trim(), password)
      setPassword('')
      setShowLoginPassword(false)
      await load()
    } catch (err) {
      setLoginError(errorMessage(err))
    } finally {
      setLoggingIn(false)
    }
  }

  const signOut = () => {
    clearToken()
    setAuthenticated(false)
    setUsername('')
    setPassword('')
    setItems([])
    setEditing(null)
    setDeleting(null)
    setToast('')
    setPasswordOpen(false)
    setPasswordError('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowLoginPassword(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setSection('dashboard')
    setError('')
    setLoginError('')
  }

  const openPasswordModal = () => {
    setPasswordError('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordOpen(true)
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from the current password.')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      showToast('Password updated successfully.')
    } catch (err) {
      setPasswordError(errorMessage(err))
    } finally {
      setPasswordSaving(false)
    }
  }

  const beginCreate = (type: ContentType = section === 'dashboard' ? 'gallery' : section) => {
    setError('')
    setEditing({
      id: 0,
      updatedAt: new Date().toISOString(),
      contentType: type,
      title: '',
      excerpt: '',
      body: '',
      imageUrl: '',
      status: 'published',
    })
    setForm({ ...emptyForm, contentType: type })
  }

  const beginEdit = (item: Content) => {
    setError('')
    setEditing(item)
    setForm({
      contentType: item.contentType,
      title: item.title,
      excerpt: item.contentType === 'gallery' ? item.excerpt : '',
      body: item.body,
      imageUrl: item.imageUrl,
      status: item.status,
    })
  }

  const handleImageUpload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.')
      return
    }

    setUploadingImage(true)
    setError('')
    try {
      const uploaded = await uploadImage(file)
      setForm((current) => ({ ...current, imageUrl: uploaded.url }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setUploadingImage(false)
    }
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (uploadingImage) {
      setError('Please wait for the image upload to finish.')
      return
    }
    if (form.contentType === 'gallery' && !form.imageUrl.trim()) {
      setError('Image is required for gallery items.')
      return
    }

    const isEdit = Boolean(editing && editing.id > 0)
    const title = form.title.trim()
    const contentType = form.contentType

    setSaving(true)
    setError('')
    try {
      await saveContent(editing && editing.id > 0 ? editing : null, form)
      setEditing(null)
      await load()
      showToast(
        `${contentType === 'gallery' ? 'Gallery item' : 'News article'} "${title}" ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = (item: Content) => {
    setError('')
    setDeleting(item)
  }

  const confirmDelete = async () => {
    if (!deleting) return

    const { contentType, title } = deleting
    setDeletingBusy(true)
    setError('')
    try {
      await deleteContent(deleting)
      setDeleting(null)
      await load()
      showToast(
        `${contentType === 'gallery' ? 'Gallery item' : 'News article'} "${title}" deleted successfully.`,
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setDeletingBusy(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] text-[#1d211f]">
        <p className="text-sm text-[#858b85]">Checking session…</p>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5 py-12 text-[#1d211f]">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo-kitasku.png" alt="KITASKU.ID" className="size-11 object-contain" />
            <div>
              <p className="text-sm font-bold tracking-[0.16em] text-[#bd8d35]">KITASKU.ID</p>
              <h1 className="mt-0.5 text-xl font-semibold tracking-tight">Admin CMS</h1>
            </div>
          </div>

          <form onSubmit={submitLogin} className="rounded-2xl border border-[#e5e6e1] bg-white p-6 shadow-[0_8px_30px_rgba(39,45,39,0.06)]">
            <h2 className="text-lg font-semibold">Sign in to manage content</h2>
            <p className="mt-1 text-sm text-[#858b85]">Use your admin account to continue.</p>

            {loginError && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loginError}
              </p>
            )}

            <label className="mt-6 grid gap-2 text-sm font-medium text-[#555c55]">
              Username or email
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                className="rounded-xl border border-[#dfe2dc] bg-white px-3 py-3 text-[#1d211f] outline-none focus:border-[#bd8d35]"
              />
            </label>

            <label className="mt-4 grid gap-2 text-sm font-medium text-[#555c55]">
              Password
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-[#dfe2dc] bg-white py-3 pl-3 pr-11 text-[#1d211f] outline-none focus:border-[#bd8d35]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#737972] transition hover:bg-[#f3f4f1] hover:text-[#1d211f]"
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loggingIn}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#bd8d35] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a97927] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1d211f]">
      {toast && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[70] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-2xl"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
            className="rounded p-0.5 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-[#e5e6e1] bg-white p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[280px] lg:flex-col lg:border-b-0 lg:border-l lg:p-7">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-2.5">
              <img src="/logo-kitasku.png" alt="KITASKU.ID" className="size-9 object-contain" />
              <div>
                <p className="text-sm font-bold tracking-[0.16em] text-[#bd8d35]">KITASKU.ID</p>
                <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#252a26]">Content management</h2>
              </div>
            </div>
            <Menu className="text-[#8b918b] lg:hidden" />
          </div>

          <nav className="mt-7 grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-1">
            <button
              onClick={() => setSection('dashboard')}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${section === 'dashboard' ? 'bg-[#f2ecdd] text-[#8b641f]' : 'text-[#737972] hover:bg-[#f5f6f3]'}`}
            >
              <LayoutDashboard size={17} /> <span className="hidden lg:inline">Dashboard</span>
            </button>
            {sections.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSection(type)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${section === type ? 'bg-[#f2ecdd] text-[#8b641f]' : 'text-[#737972] hover:bg-[#f5f6f3]'}`}
              >
                <Icon size={17} /> <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden rounded-2xl bg-[#f7f7f5] p-4 lg:block">
            <p className="text-xs font-semibold text-[#4d554e]">Public website</p>
            <p className="mt-1 text-xs leading-5 text-[#8a908a]">Changes here update the content displayed on the main page.</p>
            <a href="/" className="mt-3 inline-block text-xs font-semibold text-[#9a7025]">View website →</a>
          </div>

        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-[#e5e6e1] bg-white px-5 py-6 md:px-10 md:py-8">
            <div className="mx-auto flex max-w-6xl items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ad8131]">
                  {section === 'dashboard' ? 'Overview' : activeSection?.label}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                  {section === 'dashboard' ? 'Content dashboard' : `Manage ${activeSection?.label.toLowerCase()}`}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-[#7c827c]">
                  {section === 'dashboard' ? 'Keep your gallery and news current in one place.' : activeSection?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {section !== 'dashboard' && (
                  <button
                    onClick={() => beginCreate()}
                    className="hidden items-center gap-2 rounded-xl bg-[#bd8d35] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a97927] sm:flex"
                  >
                    <Plus size={16} /> Add {activeSection?.label.slice(0, -1)}
                  </button>
                )}
                <button
                  onClick={openPasswordModal}
                  title="Change password"
                  aria-label="Change password"
                  className="flex items-center gap-2 rounded-xl border border-[#dfe2dc] bg-white px-3 py-3 text-sm font-semibold text-[#555c55] transition hover:bg-[#f5f6f3]"
                >
                  <KeyRound size={16} /> <span className="hidden md:inline">Change password</span>
                </button>
                <button
                  onClick={signOut}
                  title="Logout"
                  aria-label="Logout"
                  className="flex items-center gap-2 rounded-xl border border-[#dfe2dc] bg-white px-3 py-3 text-sm font-semibold text-[#555c55] transition hover:bg-[#f5f6f3]"
                >
                  <LogOut size={16} /> <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-7 md:px-10 md:py-10">
            {error && (
              <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{error}</span>
                <button aria-label="Dismiss error" onClick={() => setError('')} className="rounded p-1 hover:bg-red-100">
                  <X size={15} />
                </button>
              </div>
            )}

            {section === 'dashboard' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {sections.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setSection(type)}
                    className="rounded-2xl border border-[#e5e6e1] bg-white p-5 text-left shadow-[0_8px_30px_rgba(39,45,39,0.04)] transition hover:-translate-y-0.5 hover:border-[#ceb77e]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-xl bg-[#f3eddf] p-2.5 text-[#a97b2b]"><Icon size={18} /></span>
                      <span className="text-3xl font-semibold">{counts[type]}</span>
                    </div>
                    <p className="mt-5 font-semibold">{label}</p>
                    <p className="mt-1 text-xs text-[#858b85]">Published items</p>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#858b85]">
                      {visible.length} {activeSection?.label.toLowerCase()} published
                    </p>
                  </div>
                  <button
                    onClick={() => beginCreate()}
                    className="flex items-center gap-2 rounded-xl bg-[#bd8d35] px-4 py-3 text-sm font-semibold text-white shadow-sm sm:hidden"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                <div className="rounded-2xl border border-[#e5e6e1] bg-white shadow-[0_8px_30px_rgba(39,45,39,0.04)]">
                  {section === 'gallery' ? (
                    <GalleryCards
                      items={visible}
                      loading={loading}
                      onEdit={beginEdit}
                      onDelete={requestDelete}
                      emptyLabel={`No ${activeSection?.label.toLowerCase()} yet. Add your first item.`}
                    />
                  ) : (
                    <ContentList
                      items={visible}
                      loading={loading}
                      onEdit={beginEdit}
                      onDelete={requestDelete}
                      emptyLabel={`No ${activeSection?.label.toLowerCase()} yet. Add your first item.`}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <Editor
          editing={editing}
          form={form}
          setForm={setForm}
          saving={saving}
          uploadingImage={uploadingImage}
          onUploadImage={handleImageUpload}
          error={error}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {passwordOpen && (
        <div className="fixed inset-0 z-[66] flex items-center justify-center bg-[#1d211f]/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitPassword}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
            className="w-full max-w-md rounded-2xl border border-[#e2e4df] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ad8131]">Account</p>
                <h2 id="password-dialog-title" className="mt-2 text-xl font-semibold">Change password</h2>
              </div>
              <button
                type="button"
                onClick={() => setPasswordOpen(false)}
                disabled={passwordSaving}
                aria-label="Close"
                className="rounded-lg p-2 text-[#737972] transition hover:bg-[#f3f4f1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordError}
              </p>
            )}

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-[#555c55]">
                Current password
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[#dfe2dc] bg-white py-3 pl-3 pr-11 text-[#1d211f] outline-none focus:border-[#bd8d35]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#737972] transition hover:bg-[#f3f4f1] hover:text-[#1d211f]"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#555c55]">
                New password
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[#dfe2dc] bg-white py-3 pl-3 pr-11 text-[#1d211f] outline-none focus:border-[#bd8d35]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#737972] transition hover:bg-[#f3f4f1] hover:text-[#1d211f]"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#555c55]">
                Confirm new password
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[#dfe2dc] bg-white py-3 pl-3 pr-11 text-[#1d211f] outline-none focus:border-[#bd8d35]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm new password' : 'Show confirm new password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#737972] transition hover:bg-[#f3f4f1] hover:text-[#1d211f]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPasswordOpen(false)}
                disabled={passwordSaving}
                className="rounded-xl border border-[#dfe2dc] px-4 py-3 text-sm font-semibold text-[#555c55] transition hover:bg-[#f5f6f3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-xl bg-[#bd8d35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a97927] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#1d211f]/40 p-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-md rounded-2xl border border-[#e2e4df] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-red-50 p-3 text-red-600">
                <Trash2 size={20} />
              </span>
              <div>
                <h2 id="delete-dialog-title" className="text-lg font-semibold text-[#1d211f]">Delete this item?</h2>
                <p className="mt-2 text-sm leading-6 text-[#737972]">
                  &quot;{deleting.title}&quot; will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={deletingBusy}
                className="rounded-xl border border-[#dfe2dc] px-4 py-3 text-sm font-semibold text-[#555c55] transition hover:bg-[#f5f6f3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingBusy}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function GalleryCards({
  items,
  loading,
  onEdit,
  onDelete,
  emptyLabel = 'No gallery images yet.',
}: {
  items: Content[]
  loading: boolean
  onEdit: (item: Content) => void
  onDelete: (item: Content) => void
  emptyLabel?: string
}) {
  if (loading) return <p className="p-7 text-sm text-[#858b85]">Loading gallery…</p>
  if (!items.length) return <p className="p-7 text-sm text-[#858b85]">{emptyLabel}</p>

  return (
    <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-2xl border border-[#e5e6e1] bg-white shadow-[0_8px_30px_rgba(39,45,39,0.05)]">
          <div className="aspect-[4/3] overflow-hidden bg-[#f1f2ee]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="size-full object-cover transition duration-300 hover:scale-105" />
            ) : (
              <div className="flex size-full items-center justify-center text-[#a97b2b]"><ImageIcon size={32} /></div>
            )}
          </div>
          <div className="p-4">
            <p className="truncate font-semibold text-[#1d211f]">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#858b85]">{item.excerpt || 'No caption added yet.'}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#9a9f99]">{new Date(item.updatedAt).toLocaleDateString()}</span>
              <div className="flex gap-2">
                <button
                  aria-label={`Edit ${item.title}`}
                  onClick={() => onEdit(item)}
                  className="rounded-lg border border-[#e1e3de] p-2.5 text-[#737972] transition hover:border-[#bd8d35] hover:text-[#9a7025]"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  aria-label={`Delete ${item.title}`}
                  onClick={() => onDelete(item)}
                  className="rounded-lg border border-[#e1e3de] p-2.5 text-[#737972] transition hover:border-red-300 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function ContentList({
  items,
  loading,
  onEdit,
  onDelete,
  emptyLabel = 'No content yet.',
}: {
  items: Content[]
  loading: boolean
  onEdit: (item: Content) => void
  onDelete: (item: Content) => void
  emptyLabel?: string
}) {
  if (loading) return <p className="p-7 text-sm text-[#858b85]">Loading content…</p>
  if (!items.length) return <p className="p-7 text-sm text-[#858b85]">{emptyLabel}</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="border-b border-[#ecece8] bg-[#fafaf8] text-xs uppercase tracking-[0.12em] text-[#858b85]">
          <tr>
            <th className="px-5 py-4 font-semibold">Content</th>
            <th className="px-5 py-4 font-semibold">Updated</th>
            <th className="px-5 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ecece8]">
          {items.map((item) => (
            <tr key={item.id} className="transition hover:bg-[#fcfcfa]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f1f2ee] text-[#a97b2b]">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" /> : <Newspaper size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1d211f]">{item.title}</p>
                    <p className="mt-1 max-w-md truncate text-xs text-[#858b85]">{stripHtml(item.excerpt || item.body)}</p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-[#858b85]">{new Date(item.updatedAt).toLocaleDateString()}</td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    aria-label={`Edit ${item.title}`}
                    onClick={() => onEdit(item)}
                    className="rounded-lg border border-[#e1e3de] p-2.5 text-[#737972] transition hover:border-[#bd8d35] hover:text-[#9a7025]"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    aria-label={`Delete ${item.title}`}
                    onClick={() => onDelete(item)}
                    className="rounded-lg border border-[#e1e3de] p-2.5 text-[#737972] transition hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Editor({
  editing,
  form,
  setForm,
  saving,
  uploadingImage,
  onUploadImage,
  error,
  onClose,
  onSave,
}: {
  editing: Content
  form: ContentForm
  setForm: Dispatch<SetStateAction<ContentForm>>
  saving: boolean
  uploadingImage: boolean
  onUploadImage: (file?: File) => void
  error: string
  onClose: () => void
  onSave: () => void
}) {
  const typeLabel = form.contentType === 'gallery' ? 'Gallery image' : 'News article'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d211f]/30 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e2e4df] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between border-b border-[#ecece8] pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ad8131]">{editing.id ? 'Edit item' : 'New item'}</p>
            <h2 className="mt-2 text-2xl font-semibold">{typeLabel}</h2>
          </div>
          <button aria-label="Close editor" onClick={onClose} className="rounded-lg p-2 text-[#737972] hover:bg-[#f3f4f1]">
            <X />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[#555c55]">
            {form.contentType === 'news' ? 'Article title' : 'Image title'}
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="rounded-xl border border-[#dfe2dc] bg-white px-3 py-3 text-[#1d211f] outline-none focus:border-[#bd8d35]"
            />
          </label>

          {form.contentType === 'gallery' && (
            <label className="grid gap-2 text-sm font-medium text-[#555c55]">
              Caption
              <textarea
                value={form.excerpt}
                onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                rows={3}
                className="rounded-xl border border-[#dfe2dc] bg-white px-3 py-3 text-[#1d211f] outline-none focus:border-[#bd8d35]"
              />
            </label>
          )}

          {form.contentType === 'news' && (
            <div className="grid gap-2 text-sm font-medium text-[#555c55]">
              <span>Full article</span>
              <RichTextEditor
                value={form.body}
                onChange={(body) => setForm((current) => ({ ...current, body }))}
              />
            </div>
          )}

          <div className="grid gap-2 text-sm font-medium text-[#555c55]">
            <span>{form.contentType === 'news' ? 'Cover image' : 'Image'}</span>
            {form.imageUrl ? (
              <div className="overflow-hidden rounded-xl border border-[#dfe2dc] bg-[#f1f2ee]">
                <img src={form.imageUrl} alt="Selected upload preview" className="h-44 w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d7dad3] bg-[#fafaf8] text-[#9a9f99]">
                <ImageIcon size={26} />
                <span className="text-xs font-normal">No image selected</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                  uploadingImage ? 'cursor-wait bg-[#bd8d35]/70' : 'bg-[#bd8d35] hover:bg-[#a97927]'
                }`}
              >
                {uploadingImage ? 'Uploading…' : form.imageUrl ? 'Replace image' : 'Choose image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingImage}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    onUploadImage(file)
                  }}
                />
              </label>
              {form.imageUrl && !uploadingImage && (
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}
                  className="rounded-xl border border-[#dfe2dc] px-4 py-2.5 text-sm font-semibold text-[#555c55] transition hover:bg-[#f5f6f3]"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs font-normal text-[#858b85]">
              JPG, PNG, WEBP, or GIF up to 5 MB.{' '}
              {form.contentType === 'news' ? 'Optional cover for the article card.' : 'Required for gallery items.'}
            </p>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3 border-t border-[#ecece8] pt-5">
          <button onClick={onClose} className="rounded-xl border border-[#dfe2dc] px-4 py-3 text-sm font-semibold text-[#555c55] transition hover:bg-[#f5f6f3]">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || uploadingImage}
            className="rounded-xl bg-[#bd8d35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a97927] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : uploadingImage ? 'Uploading…' : editing.id ? 'Save changes' : 'Create item'}
          </button>
        </div>
      </div>
    </div>
  )
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeInitialHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return value
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const lastHtmlRef = useRef<string>('')
  const savedRangeRef = useRef<Range | null>(null)
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({})
  const [blockTag, setBlockTag] = useState<string>('p')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (value !== lastHtmlRef.current) {
      const html = normalizeInitialHtml(value)
      el.innerHTML = html
      lastHtmlRef.current = value
    }
  }, [value])

  const refreshToolbarState = () => {
    if (typeof document === 'undefined') return
    const next: Record<string, boolean> = {}
    const commands = [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'insertUnorderedList',
      'insertOrderedList',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
    ]
    for (const cmd of commands) {
      try {
        next[cmd] = document.queryCommandState(cmd)
      } catch {
        next[cmd] = false
      }
    }
    try {
      const rawBlock = String(document.queryCommandValue('formatBlock') || 'p')
        .replace(/[<>]/g, '')
        .toLowerCase()
      setBlockTag(rawBlock || 'p')
    } catch {
      setBlockTag('p')
    }
    setActiveFormats(next)
  }

  const syncContent = () => {
    const el = editorRef.current
    if (!el) return
    const raw = el.innerHTML
    const textOnly = stripHtml(raw)
    const nextValue = textOnly ? raw : ''
    lastHtmlRef.current = nextValue
    onChange(nextValue)
    refreshToolbarState()
  }

  const runCommand = (command: string, arg?: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    document.execCommand(command, false, arg)
    syncContent()
  }

  const openLinkInput = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
    setLinkUrl('https://')
    setLinkDialogOpen(true)
  }

  const applyLink = () => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    if (savedRangeRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedRangeRef.current)
      }
    }
    const trimmed = linkUrl.trim()
    if (trimmed && trimmed !== 'https://') {
      document.execCommand('createLink', false, trimmed)
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
    savedRangeRef.current = null
    syncContent()
  }

  const toolbarBtnClass = (active = false) =>
    `inline-flex size-8 items-center justify-center rounded-lg transition ${
      active
        ? 'bg-[#f2ecdd] text-[#8b641f] shadow-xs'
        : 'text-[#555c55] hover:bg-[#eceee9] hover:text-[#1d211f]'
    }`

  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe2dc] bg-white transition focus-within:border-[#bd8d35]">
      <div
        role="toolbar"
        aria-label="Rich text formatting toolbar"
        className="flex flex-wrap items-center gap-1 border-b border-[#ecece8] bg-[#fafaf8] px-2.5 py-2"
      >
        <button
          type="button"
          title="Paragraph"
          aria-label="Paragraph"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('formatBlock', 'P')}
          className={toolbarBtnClass(blockTag === 'p' || blockTag === 'div')}
        >
          <Pilcrow size={15} />
        </button>
        <button
          type="button"
          title="Heading 2"
          aria-label="Heading 2"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('formatBlock', 'H2')}
          className={toolbarBtnClass(blockTag === 'h2')}
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          title="Heading 3"
          aria-label="Heading 3"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('formatBlock', 'H3')}
          className={toolbarBtnClass(blockTag === 'h3')}
        >
          <Heading3 size={16} />
        </button>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#dfe2dc]" />

        <button
          type="button"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('bold')}
          className={toolbarBtnClass(activeFormats.bold)}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('italic')}
          className={toolbarBtnClass(activeFormats.italic)}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          aria-label="Underline"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('underline')}
          className={toolbarBtnClass(activeFormats.underline)}
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          title="Strikethrough"
          aria-label="Strikethrough"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('strikeThrough')}
          className={toolbarBtnClass(activeFormats.strikeThrough)}
        >
          <Strikethrough size={15} />
        </button>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#dfe2dc]" />

        <button
          type="button"
          title="Bullet list"
          aria-label="Bullet list"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('insertUnorderedList')}
          className={toolbarBtnClass(activeFormats.insertUnorderedList)}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          title="Numbered list"
          aria-label="Numbered list"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('insertOrderedList')}
          className={toolbarBtnClass(activeFormats.insertOrderedList)}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          title="Quote"
          aria-label="Quote"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('formatBlock', 'BLOCKQUOTE')}
          className={toolbarBtnClass(blockTag === 'blockquote')}
        >
          <Quote size={15} />
        </button>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#dfe2dc]" />

        <button
          type="button"
          title="Align left"
          aria-label="Align left"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('justifyLeft')}
          className={toolbarBtnClass(activeFormats.justifyLeft)}
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          title="Align center"
          aria-label="Align center"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('justifyCenter')}
          className={toolbarBtnClass(activeFormats.justifyCenter)}
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          title="Align right"
          aria-label="Align right"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('justifyRight')}
          className={toolbarBtnClass(activeFormats.justifyRight)}
        >
          <AlignRight size={15} />
        </button>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#dfe2dc]" />

        <button
          type="button"
          title="Insert link"
          aria-label="Insert link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openLinkInput}
          className={toolbarBtnClass(linkDialogOpen)}
        >
          <Link2 size={15} />
        </button>
        <button
          type="button"
          title="Remove link"
          aria-label="Remove link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('unlink')}
          className={toolbarBtnClass(false)}
        >
          <Unlink size={15} />
        </button>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#dfe2dc]" />

        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('undo')}
          className={toolbarBtnClass(false)}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('redo')}
          className={toolbarBtnClass(false)}
        >
          <Redo2 size={15} />
        </button>
        <button
          type="button"
          title="Clear formatting"
          aria-label="Clear formatting"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('removeFormat')}
          className={toolbarBtnClass(false)}
        >
          <RemoveFormatting size={15} />
        </button>
      </div>

      {linkDialogOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#ecece8] bg-[#f7f7f5] px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            className="min-w-[200px] flex-1 rounded-lg border border-[#dfe2dc] bg-white px-2.5 py-1.5 text-xs text-[#1d211f] outline-none focus:border-[#bd8d35]"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-lg bg-[#bd8d35] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#a97927]"
          >
            Apply link
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkDialogOpen(false)
              setLinkUrl('')
            }}
            className="rounded-lg border border-[#dfe2dc] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#555c55] transition hover:bg-[#f5f6f3]"
          >
            Cancel
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Full article"
        onInput={syncContent}
        onKeyUp={refreshToolbarState}
        onMouseUp={refreshToolbarState}
        onBlur={syncContent}
        className="max-h-72 min-h-[190px] overflow-y-auto px-3.5 py-3 text-sm leading-6 font-normal text-[#1d211f] outline-none [&_a]:text-[#9a7025] [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#bd8d35] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#555c55] [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  )
}
