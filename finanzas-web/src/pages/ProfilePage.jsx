import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, CircleHelp, LoaderCircle, LogOut, ReceiptText, SlidersHorizontal, Target, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/category-label'

function QuickExpensePreference() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [categories, setCategories] = useState([])
  const [savedId, setSavedId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [draftId, setDraftId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [saveError, setSaveError] = useState('')
  const timerRef = useRef(null)
  const requestRef = useRef(null)

  const isGlobalOtro = (cat) => cat.user_id === null && cat.nombre === 'Otro Egreso'

  const fetchData = useCallback((signal) => {
    return Promise.all([
      api.get('/categorias?tipo=egreso', { accountId: user?.id, signal }),
      api.get('/preferencias/gasto-hormiga', { accountId: user?.id, signal }),
    ])
      .then(([cats, pref]) => {
        if (signal.aborted) return
        const catList = Array.isArray(cats) ? cats : []
        setCategories(catList)
        const globalOtro = catList.find(isGlobalOtro)
        const initialId = pref?.categoria_id != null && pref.categoria_id !== globalOtro?.id
          ? String(pref.categoria_id)
          : ''
        setSavedId(initialId)
        setSelectedId(initialId)
        setLoading(false)
      })
      .catch((error) => {
        if (signal.aborted || error.name === 'AbortError') return
        setLoadError(true)
        setLoading(false)
      })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    const controller = new AbortController()
    requestRef.current = controller

    fetchData(controller.signal)

    return () => {
      controller.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user?.id, fetchData])

  function handleRetry() {
    setLoading(true)
    setLoadError(false)
    setSaveError('')
    setDraftId(null)
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    fetchData(controller.signal)
  }

  async function savePreference(targetId) {
    if (saving) return
    setSaving(true)
    setSaveStatus('')
    setSaveError('')
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      const res = await api.put(
        '/preferencias/gasto-hormiga',
        { categoria_id: targetId ? Number(targetId) : null },
        { accountId: user?.id }
      )
      const globalOtro = categories.find(isGlobalOtro)
      const confirmed = res?.categoria_id != null && res.categoria_id !== globalOtro?.id
        ? String(res.categoria_id)
        : ''
      setSavedId(confirmed)
      setSelectedId(confirmed)
      setDraftId(null)
      setSaveStatus('Guardado')
      timerRef.current = setTimeout(() => setSaveStatus(''), 3000)
    } catch {
      setDraftId(targetId)
      setSelectedId(savedId)
      setSaveError('No pudimos guardar la preferencia.')
    } finally {
      setSaving(false)
    }
  }

  function handleChange(event) {
    const nextVal = event.target.value
    setSelectedId(nextVal)
    savePreference(nextVal)
  }

  function retryDraft() {
    if (draftId !== null) {
      setSelectedId(draftId)
      savePreference(draftId)
    }
  }

  const selectableCategories = categories.filter((cat) => !isGlobalOtro(cat))

  return (
    <div className="mb-5 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <ReceiptText size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor="quick-expense-pref-select" className="block font-bold text-[var(--saldo-ink)]">
            Categoría para gasto hormiga
          </label>
          <p className="mt-0.5 text-sm text-[var(--saldo-muted)]">
            Elige la categoría en la que se registrarán tus gastos hormiga desde el inicio.
          </p>

          {loading ? (
            <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[var(--saldo-muted)]">
              <LoaderCircle size={15} className="motion-safe:animate-spin" aria-hidden="true" />
              Cargando categorías…
            </p>
          ) : loadError ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p role="alert" className="text-sm text-rose-700">No pudimos consultar las categorías.</p>
              <Button variant="secondary" size="sm" onClick={handleRetry}>Reintentar</Button>
            </div>
          ) : (
            <div className="mt-3">
              <select
                id="quick-expense-pref-select"
                className="h-10 w-full rounded-xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-3 text-sm text-[var(--saldo-ink)] outline-none focus:border-[var(--saldo-forest)]"
                value={selectedId}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Usar Otro egreso</option>
                {selectableCategories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {categoryLabel(cat.nombre)}
                  </option>
                ))}
              </select>
              {saving && (
                <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-[var(--saldo-muted)]">
                  <LoaderCircle size={13} className="motion-safe:animate-spin" aria-hidden="true" /> Guardando…
                </p>
              )}
              {saveStatus && (
                <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--saldo-forest)]">
                  <Check size={14} aria-hidden="true" /> {saveStatus}
                </p>
              )}
              {saveError && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p role="alert" className="text-xs text-rose-700">
                    {saveError}
                  </p>
                  {draftId !== null && (
                    <Button variant="secondary" size="sm" onClick={retryDraft}>
                      Reintentar
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { query } = useDashboardPeriod()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // AuthContext clears the session even if the server cannot be reached.
    }
    navigate('/login', { replace: true })
  }

  return (
    <section className="saldo-profile" aria-labelledby="profile-title">
      <h1 id="profile-title">Mi perfil</h1>
      <div className="saldo-profile-account">
        <span className="saldo-avatar"><UserRound size={20} aria-hidden="true" /></span>
        <div>
          <h2 className="font-bold">{user?.name || 'Mi cuenta'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <QuickExpensePreference />

      <Link
        className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-4 py-3 motion-safe:transition-colors hover:bg-[var(--saldo-wash)]"
        to={`/perfil/metas?${query}`}
        aria-labelledby="profile-goals-title"
        aria-describedby="profile-goals-description"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <Target size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span id="profile-goals-title" className="font-bold">Mis metas</span>
          <span id="profile-goals-description" className="text-sm text-[var(--saldo-muted)]">Define tu meta de ahorro y consulta el avance.</span>
        </span>
        <ChevronRight className="ml-auto shrink-0 text-[var(--saldo-muted)]" size={18} aria-hidden="true" />
      </Link>
      <Link
        className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-4 py-3 motion-safe:transition-colors hover:bg-[var(--saldo-wash)]"
        to={`/perfil/personalizar?${query}`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <SlidersHorizontal size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="font-bold">Tarjetas y cobros</span>
        <ChevronRight className="ml-auto shrink-0 text-[var(--saldo-muted)]" size={18} aria-hidden="true" />
      </Link>
      <Link
        className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-4 py-3 motion-safe:transition-colors hover:bg-[var(--saldo-wash)]"
        to={`/?${query}`}
        state={{ showSaldoTour: true }}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <CircleHelp size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="font-bold">Ver guía de Saldo</span>
        <ChevronRight className="ml-auto shrink-0 text-[var(--saldo-muted)]" size={18} aria-hidden="true" />
      </Link>
      <Button variant="secondary" onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Cerrar sesión</Button>
    </section>
  )
}
