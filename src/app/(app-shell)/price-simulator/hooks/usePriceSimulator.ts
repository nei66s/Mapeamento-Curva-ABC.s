import { useEffect, useMemo, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import type { Store } from '@/lib/types'
import {
  FormState,
  getInitialFormState,
  deriveComplexitySuggestion,
  equipmentCatalog,
  defaultEquipmentSuggestion,
  SAP_HEADER_MAP,
  SAP_JUSTIFICATION_MAP,
  HOURS_PER_DAY,
  HOURS_PER_YEAR,
} from '../data'

function usePriceSimulator() {
  const [form, setForm] = useState<FormState>(getInitialFormState())
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatingDescription, setGeneratingDescription] = useState<boolean>(false)
  const [descriptionGenError, setDescriptionGenError] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [storeLoading, setStoreLoading] = useState<boolean>(true)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [nanoBanana, setNanoBanana] = useState<{ loading: boolean; image?: string; prompt?: string; error?: string }>({
    loading: false,
  })
  const [editableBreakdown, setEditableBreakdown] = useState<Array<{ label: string; amount: number }>>([])
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0)
  const [newBreakdownLabel, setNewBreakdownLabel] = useState('')
  const [newBreakdownAmount, setNewBreakdownAmount] = useState('')
  const [tableReference, setTableReference] = useState('')
  const [suggestedHours, setSuggestedHours] = useState<number | null>(null)
  const [showSources, setShowSources] = useState<boolean>(false)
  const [hoursManuallyEdited, setHoursManuallyEdited] = useState<boolean>(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [showClarifyModal, setShowClarifyModal] = useState<boolean>(false)
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, any>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('price-simulator:state')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.form) setForm((f) => ({ ...f, ...parsed.form }))
        if (parsed?.result) setResult(parsed.result)
        if (Array.isArray(parsed?.editableBreakdown)) setEditableBreakdown(parsed.editableBreakdown)
        if (typeof parsed?.selectedScenarioIndex === 'number') setSelectedScenarioIndex(parsed.selectedScenarioIndex)
        if (typeof parsed?.tableReference === 'string') setTableReference(parsed.tableReference)
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [])

  const persistLocalState = useCallback(() => {
    try {
      const toSave = {
        form,
        result,
        editableBreakdown,
        selectedScenarioIndex,
        tableReference,
      }
      localStorage.setItem('price-simulator:state', JSON.stringify(toSave))
      setLastSavedAt(Date.now())
    } catch (e) {
      // ignore quota errors
    }
  }, [form, result, editableBreakdown, selectedScenarioIndex, tableReference])

  useEffect(() => {
    persistLocalState()
  }, [persistLocalState])

  // Auto-hide the saved badge after 20s
  useEffect(() => {
    if (!lastSavedAt) return
    const id = window.setTimeout(() => setLastSavedAt(null), 20000)
    return () => window.clearTimeout(id)
  }, [lastSavedAt])

  // Warn the user on accidental navigation/refresh when the form has unsaved changes
  useEffect(() => {
    const isDirty = () => {
      try {
        const initial = getInitialFormState()
        return JSON.stringify(form) !== JSON.stringify(initial) || (editableBreakdown && editableBreakdown.length > 0)
      } catch (e) {
        return false
      }
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault()
        // Chrome requires returnValue to be set
        e.returnValue = ''
        return ''
      }
      return undefined
    }

    const onPageHide = () => {
      try {
        const toSave = { form, result, editableBreakdown, selectedScenarioIndex, tableReference }
        localStorage.setItem('price-simulator:state', JSON.stringify(toSave))
        setLastSavedAt(Date.now())
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [form, editableBreakdown, selectedScenarioIndex, tableReference, result])

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }, [])

  const makeAutoTitle = useCallback(() => {
    if (form.tipo === 'equipamento') {
      const parts = [form.equipamentoMarca, form.equipamentoModelo].filter(Boolean)
      return parts.join(' ') || 'Reparo/serviço em equipamento'
    }
    if (form.tipo === 'civil') {
      return form.area_m2 > 0 ? `Obra civil ~${form.area_m2}m²` : 'Serviço civil / obra'
    }
    return 'Serviço de manutenção'
  }, [form.tipo, form.equipamentoMarca, form.equipamentoModelo, form.area_m2])

  const updateClarify = (patch: Record<string, any>) => {
    setClarifyAnswers((previous) => ({ ...previous, ...patch }))
  }

  const addCivilItemToBreakdown = (item: any) => {
    const qty = Math.max(1, Number(form.quantidade) || 1)
    const area = Math.max(0, Number(form.area_m2) || 0)
    const complexityMultiplier = form.complexidade === 'baixa' ? 0.9 : form.complexidade === 'media' ? 1 : 1.3
    const materialMultiplier = form.materialQualidade === 'low' ? 0.95 : form.materialQualidade === 'medium' ? 1 : 1.15

    let amount = 0
    if (item.isHours && item.hours && item.ratePerHour) {
      amount = Math.round(item.hours * item.ratePerHour * qty)
    } else if (item.ratePerM2) {
      amount = Math.round(area * item.ratePerM2 * complexityMultiplier * materialMultiplier * qty)
    } else if (item.flat) {
      amount = Math.round(item.flat * qty)
    }

    setEditableBreakdown((prev) => {
      const existingIndex = prev.findIndex((p) => p.label === item.label)
      if (existingIndex >= 0) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          amount: Number(next[existingIndex].amount || 0) + amount,
        }
        return next
      }
      return [...prev, { label: item.label, amount }]
    })
  }

  const resetForm = () => {
    setForm(getInitialFormState())
    setResult(null)
    setError(null)
    setSelectedStoreId('')
    setNanoBanana({ loading: false })
  }

  const uppercaseDescription = useMemo(() => {
    const trimmed = form.descricao.trim()
    return trimmed ? trimmed.toUpperCase() : 'DESCRIÇÃO NÃO INFORMADA'
  }, [form.descricao])

  const sapHeader = SAP_HEADER_MAP[form.tipo]
  const sapJustification = SAP_JUSTIFICATION_MAP[form.tipo]

  const complexitySuggestion = useMemo(() => deriveComplexitySuggestion(form.descricao), [form.descricao])

  const equipmentSuggestion = useMemo(() => {
    if (form.tipo !== 'equipamento') return null
    const normalized = form.descricao.toLowerCase()
    const matched = equipmentCatalog.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
    return matched || defaultEquipmentSuggestion
  }, [form.tipo, form.descricao])

  const formatSavedTime = (ts: number | null) => {
    if (!ts) return ''
    const diff = Date.now() - ts
    if (diff < 5000) return 'Rascunho salvo (agora)'
    if (diff < 60000) return `Rascunho salvo há ${Math.round(diff / 1000)}s`
    if (diff < 3600000) return `Rascunho salvo há ${Math.round(diff / 60000)}m`
    return `Rascunho salvo há ${Math.round(diff / 3600000)}h`
  }

  const saveDraft = useCallback(async () => {
    setSavingDraft(true)
    try {
      persistLocalState()
    } finally {
      setSavingDraft(false)
    }
  }, [persistLocalState])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem('price-simulator:state')
      setForm(getInitialFormState())
      setEditableBreakdown([])
      setSelectedScenarioIndex(0)
      setTableReference('')
      setResult(null)
      setLastSavedAt(null)
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setStoreLoading(true)
    fetch('/api/stores')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar lojas')
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data)) {
          setStores(data)
          setStoreError(null)
        } else {
          setStoreError('Resposta inesperada do catálogo de lojas')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setStoreError(err?.message || 'Erro ao consultar lojas')
      })
      .finally(() => {
        if (isMounted) setStoreLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])
  useEffect(() => {
    if (result) {
      if (Array.isArray(result.scenarios) && result.scenarios.length > 0) {
        const idx = 0
        setSelectedScenarioIndex(idx)
        const sc = result.scenarios[idx]
        setEditableBreakdown((sc?.breakdown || []).map((item: any) => ({ label: item.label, amount: Number(item.amount) || 0 })))
        return
      }
      if (result?.breakdown && Array.isArray(result.breakdown)) {
        setEditableBreakdown(result.breakdown.map((item: any) => ({ label: item.label, amount: Number(item.amount) || 0 })))
        return
      }
    }
    if (!result) {
      setEditableBreakdown([])
    }
  }, [result])

  useEffect(() => {
    function computeSuggested(): number | null {
      if (result && typeof result.suggestedHours === 'number') return Math.max(0, Math.round(Number(result.suggestedHours) / 8))
      const qty = Math.max(1, Number(form.quantidade) || 1)
      const area = Math.max(0, Number(form.area_m2) || 0)
      const perM2 = form.tipo === 'civil' ? 0.6 : form.tipo === 'equipamento' ? 0.4 : 0.25
      let baseHours = 4
      if (area > 0) {
        baseHours = Math.max(4, Math.round(area * perM2))
      }

      const complexityMultiplier = form.complexidade === 'baixa' ? 0.9 : form.complexidade === 'media' ? 1 : 1.5
      const typeMultiplier = form.tipo === 'civil' ? 1.25 : form.tipo === 'equipamento' ? 1.1 : 1
      const materialMultiplier = form.materialQualidade === 'low' ? 0.9 : form.materialQualidade === 'medium' ? 1 : 1.15
      const alvaraMultiplier = form.precisaAlvara ? 1.25 : 1

      let estimatedHours = Math.round(baseHours * complexityMultiplier * typeMultiplier * materialMultiplier * alvaraMultiplier * qty)
      estimatedHours = Math.max(1, Math.min(480, estimatedHours))
      const estimatedDays = Math.max(0, Math.round(estimatedHours / 8))
      return estimatedDays
    }

    try {
      const sug = computeSuggested()
      setSuggestedHours(sug)
    } catch (e) {
      setSuggestedHours(null)
    }
  }, [form.tipo, form.quantidade, form.area_m2, form.complexidade, form.materialQualidade, form.precisaAlvara, result])

  useEffect(() => {
    if (!hoursManuallyEdited && suggestedHours !== null) {
      updateForm({ estimativaEquipeHoras: Number(suggestedHours) })
    }
  }, [suggestedHours, hoursManuallyEdited, updateForm])

  const manualEstimate = useMemo(
    () => editableBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [editableBreakdown]
  )

  const searchFallback = useMemo(() => {
    const parts = [
      form.tipo === 'manutencao' ? 'manutenção' : form.tipo === 'equipamento' ? 'equipamento / peça' : 'civil / obra',
      form.descricao,
      form.cidade,
      form.equipamentoMarca,
      form.equipamentoModelo,
      `complexidade ${form.complexidade}`,
      form.materialQualidade !== 'medium' ? `qualidade ${form.materialQualidade}` : '',
    ]
    return `Busca completa: ${parts.filter(Boolean).join(' · ')}`
  }, [form])

  const searchSummary = result?.search ? `Busca completa: ${result.search}` : searchFallback

  const handleBreakdownChange = (idx: number, field: 'label' | 'amount', value: string) => {
    setEditableBreakdown((prev) => {
      const next = [...prev]
      const current = next[idx]
      if (!current) return prev
      next[idx] =
        field === 'label'
          ? { ...current, label: value }
          : { ...current, amount: Number(value) || 0 }
      return next
    })
  }

  const handleRemoveBreakdownItem = (idx: number) => {
    setEditableBreakdown((prev) => prev.filter((_, index) => index !== idx))
  }

  const handleAddBreakdownItem = () => {
    const label = newBreakdownLabel.trim()
    const amount = Number(newBreakdownAmount)
    if (!label || Number.isNaN(amount)) return
    setEditableBreakdown((prev) => [...prev, { label, amount }])
    setNewBreakdownLabel('')
    setNewBreakdownAmount('')
  }

  const hasManualOverride = editableBreakdown.length > 0 && Boolean(result)

  const effectiveScenarios = useMemo(() => {
    if (result && Array.isArray(result.scenarios) && result.scenarios.length > 0) return result.scenarios
    const base = result?.estimate ?? null
    if (base == null) return []
    const mid = Number(base)
    const low = Math.round(mid * 0.8)
    const high = Math.round(mid * 1.25)
    const breakdown = Array.isArray(result?.breakdown) ? result.breakdown : []
    return [
      { name: 'Baixo', estimate: low, breakdown },
      { name: 'Médio', estimate: mid, breakdown },
      { name: 'Alto', estimate: high, breakdown },
    ]
  }, [result])

  const selectedScenario =
    effectiveScenarios && effectiveScenarios.length > 0 ? effectiveScenarios[selectedScenarioIndex] : null
  const displayEstimate = hasManualOverride ? manualEstimate : selectedScenario?.estimate ?? result?.estimate
  const detailsToShow = hasManualOverride
    ? editableBreakdown
    : selectedScenario
    ? selectedScenario.breakdown
    : result?.breakdown ?? []
  const tableReferenceValue = Number(tableReference) || 0
  const isBelowTable =
    tableReferenceValue > 0 && displayEstimate && displayEstimate < tableReferenceValue * 0.9

  const handleStoreSelection = (id: string) => {
    setSelectedStoreId(id)
    if (!id) return
    const store = stores.find((s) => s.id === id)
    if (store) {
      updateForm({ cidade: store.city || store.name })
    }
  }

  const handleCityChange = (value: string) => {
    setSelectedStoreId('')
    updateForm({ cidade: value })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setClarifyAnswers({})
    setShowClarifyModal(true)
  }

  const postPayload = useCallback(async (payload: any) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/price-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const ct = res.headers.get('content-type') || ''
      if (!res.ok) {
        if (ct.includes('application/json')) {
          const jerr = await res.json().catch(() => null)
          throw new Error(jerr?.error || `Erro ao calcular (status ${res.status})`)
        }
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Erro ao calcular (status ${res.status})`)
      }

      if (ct.includes('application/json')) {
        const j = await res.json().catch(() => null)
        if (!j) throw new Error('Resposta inválida do servidor')
        if (!j.ok) throw new Error(j.error || 'Erro ao calcular')
        setResult(j.result)
      } else {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Resposta inesperada do servidor')
      }
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmAndSubmit = useCallback(async () => {
    setShowClarifyModal(false)
    const { anosUso, ...payloadBase } = form

    if (!payloadBase.descricao && clarifyAnswers?.missingDescription) {
      payloadBase.descricao = String(clarifyAnswers.missingDescription)
    }

    let horasUso = Math.max(0, anosUso) * HOURS_PER_YEAR
    if (form.tipo === 'civil' && clarifyAnswers?.daysForThirdParty !== undefined && clarifyAnswers.daysForThirdParty !== '') {
      const days = Number(clarifyAnswers.daysForThirdParty) || 0
      horasUso = Math.max(0, days * HOURS_PER_DAY)
    } else if (form.estimativaEquipeHoras !== undefined && form.estimativaEquipeHoras !== null && Number(form.estimativaEquipeHoras) > 0) {
      const days = Number(form.estimativaEquipeHoras) || 0
      horasUso = Math.max(0, days * HOURS_PER_DAY)
    }

    const payload = { ...payloadBase, horasUso, clarify: clarifyAnswers }
    await postPayload(payload)
  }, [form, clarifyAnswers, postPayload])

  const handleGenerateNanoBanana = useCallback(async () => {
    if (nanoBanana.loading) return
    setNanoBanana({ loading: true })
    const payload = {
      ...form,
      horasUso: Math.max(0, form.anosUso) * HOURS_PER_YEAR,
    }
    try {
      const res = await fetch('/api/price-simulator/nano-banana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const ct = res.headers.get('content-type') || ''
      if (!res.ok) {
        if (ct.includes('application/json')) {
          const j = await res.json().catch(() => null)
          throw new Error(j?.error || `Erro ao gerar Nano Banana (status ${res.status})`)
        }
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Erro ao gerar Nano Banana (status ${res.status})`)
      }

      const json = await res.json().catch(() => null)
      if (!json || !json.ok) throw new Error(json?.error || 'Resposta inválida do Nano Banana')
      setNanoBanana({ loading: false, image: json.image, prompt: json.prompt })
    } catch (err: any) {
      setNanoBanana({
        loading: false,
        error: err?.message ?? String(err),
        image: undefined,
        prompt: undefined,
      })
    }
  }, [form, nanoBanana.loading])

  const handleGenerateDescription = useCallback(async () => {
    setDescriptionGenError(null)
    if (generatingDescription) return
    setGeneratingDescription(true)
    try {
      const title = form.descricao.trim() ? form.descricao.slice(0, 120) : makeAutoTitle()
      const contextParts = [
        form.cidade,
        form.tipo === 'civil' && form.area_m2 ? `${form.area_m2}m²` : '',
        form.equipamentoMarca,
        form.equipamentoModelo,
      ]
        .filter(Boolean)
        .join(' · ')
      const payload = { title, context: contextParts }
      const res = await fetch('/api/ai/generate-scope-item-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error || `Erro ao gerar descrição (status ${res.status})`)
      }
      const j = await res.json()
      if (j?.description) {
        updateForm({ descricao: j.description })
      } else if (j && typeof j === 'object') {
        updateForm({ descricao: JSON.stringify(j).slice(0, 1000) })
      }
    } catch (err: any) {
      setDescriptionGenError(err?.message ?? String(err))
    } finally {
      setGeneratingDescription(false)
    }
  }, [form, generatingDescription, makeAutoTitle, updateForm])

  return {
    setForm,
    form,
    updateForm,
    loading,
    error,
    result,
    generatingDescription,
    descriptionGenError,
    stores,
    storeLoading,
    storeError,
    selectedStoreId,
    nanoBanana,
    editableBreakdown,
    selectedScenarioIndex,
    newBreakdownLabel,
    newBreakdownAmount,
    tableReference,
    suggestedHours,
    showSources,
    hoursManuallyEdited,
    lastSavedAt,
    savingDraft,
    showClarifyModal,
    clarifyAnswers,
    uppercaseDescription,
    sapHeader,
    sapJustification,
    manualEstimate,
    detailsToShow,
    displayEstimate,
    hasManualOverride,
    searchSummary,
    effectiveScenarios,
    tableReferenceValue,
    isBelowTable,
    handleStoreSelection,
    handleCityChange,
    handleSubmit,
    confirmAndSubmit,
    handleGenerateNanoBanana,
    handleGenerateDescription,
    complexitySuggestion,
    equipmentSuggestion,
    addCivilItemToBreakdown,
    handleBreakdownChange,
    handleRemoveBreakdownItem,
    handleAddBreakdownItem,
    setNewBreakdownLabel,
    setNewBreakdownAmount,
    setTableReference,
    setSuggestedHours,
    setHoursManuallyEdited,
    setSelectedScenarioIndex,
    setShowSources,
    setShowClarifyModal,
    updateClarify,
    saveDraft,
    clearDraft,
    formatSavedTime,
    setEditableBreakdown,
    setResult,
    setLastSavedAt,
    resetForm,
  }
}

export default usePriceSimulator
