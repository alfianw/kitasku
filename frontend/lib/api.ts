const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')
const TOKEN_KEY = 'kitasku_admin_token'

export type ContentType = 'gallery' | 'news'
export type ContentStatus = 'draft' | 'published'

export type Content = {
  id: number
  contentType: ContentType
  title: string
  excerpt: string
  body: string
  imageUrl: string
  status: ContentStatus
  updatedAt: string
}

export type ContentForm = Omit<Content, 'id' | 'updatedAt'>

type ApiNews = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  status: ContentStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

type ApiGallery = {
  id: number
  title: string
  image_url: string
  caption: string
  category: string
  created_at: string
  updated_at: string
}

type Paginated<T> = {
  data: T[]
  meta: { page: number; limit: number; total: number; total_pages: number }
}

export type AdminUser = {
  id: number
  username: string
  email: string
  role: string
}

type LoginResponse = {
  token: string
  token_type: string
  expires_in: number
  user: AdminUser
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function hasToken() {
  return Boolean(getToken())
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${API_URL}. Make sure the backend is running.`)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`
    throw new ApiError(response.status, message)
  }

  return payload as T
}

export type UploadResponse = {
  url: string
  path: string
  filename: string
  size: number
  content_type: string
}

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request<UploadResponse>('/api/v1/admin/uploads', {
    method: 'POST',
    body: formData,
  })
}

export async function login(username: string, password: string) {
  const data = await request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setToken(data.token)
  return data
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return request<{ message: string }>('/api/v1/admin/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

function newsToContent(item: ApiNews): Content {
  return {
    id: item.id,
    contentType: 'news',
    title: item.title,
    excerpt: item.excerpt ?? '',
    body: item.content ?? '',
    imageUrl: item.cover_image ?? '',
    status: item.status ?? 'draft',
    updatedAt: item.updated_at,
  }
}

function galleryToContent(item: ApiGallery): Content {
  return {
    id: item.id,
    contentType: 'gallery',
    title: item.title,
    excerpt: item.caption ?? '',
    body: '',
    imageUrl: item.image_url ?? '',
    status: 'published',
    updatedAt: item.updated_at,
  }
}

export async function fetchContent(): Promise<Content[]> {
  const [news, gallery] = await Promise.all([
    request<Paginated<ApiNews>>('/api/v1/admin/news?limit=100'),
    request<Paginated<ApiGallery>>('/api/v1/admin/gallery?limit=100'),
  ])

  return [...news.data.map(newsToContent), ...gallery.data.map(galleryToContent)].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

function newsPayload(form: ContentForm) {
  return {
    title: form.title.trim(),
    excerpt: '',
    content: (form.body || form.title).trim(),
    cover_image: form.imageUrl.trim(),
    status: 'published',
  }
}

function galleryPayload(form: ContentForm) {
  return {
    title: form.title.trim(),
    image_url: form.imageUrl.trim(),
    caption: (form.excerpt || form.body).trim(),
    category: 'general',
  }
}

async function createContent(form: ContentForm): Promise<Content> {
  if (form.contentType === 'gallery') {
    const item = await request<ApiGallery>('/api/v1/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(galleryPayload(form)),
    })
    return galleryToContent(item)
  }

  const item = await request<ApiNews>('/api/v1/admin/news', {
    method: 'POST',
    body: JSON.stringify(newsPayload(form)),
  })
  return newsToContent(item)
}

async function updateContent(item: Content, form: ContentForm): Promise<Content> {
  if (form.contentType === 'gallery') {
    const updated = await request<ApiGallery>(`/api/v1/admin/gallery/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(galleryPayload(form)),
    })
    return galleryToContent(updated)
  }

  const updated = await request<ApiNews>(`/api/v1/admin/news/${item.id}`, {
    method: 'PUT',
    body: JSON.stringify(newsPayload(form)),
  })
  return newsToContent(updated)
}

export async function saveContent(existing: Content | null, form: ContentForm): Promise<Content> {
  if (!existing) return createContent(form)
  if (existing.contentType === form.contentType) return updateContent(existing, form)

  await deleteContent(existing)
  return createContent(form)
}

export async function deleteContent(item: Pick<Content, 'id' | 'contentType'>) {
  const resource = item.contentType === 'gallery' ? 'gallery' : 'news'
  await request<void>(`/api/v1/admin/${resource}/${item.id}`, { method: 'DELETE' })
}

export async function fetchPublicNews(limit = 100) {
  return request<Paginated<ApiNews>>(`/api/v1/news?limit=${limit}`)
}

export async function fetchPublicGallery(limit = 100) {
  return request<Paginated<ApiGallery>>(`/api/v1/gallery?limit=${limit}`)
}
