"use client"

import usePriceSimulator from './hooks/usePriceSimulator'
import {
  CIVIL_COMMON_ITEMS,
  complexityLabelMap,
  FormState,
  currencyFormatter,
  HOURS_PER_YEAR,
  STORE_DATALIST_ID,
} from './data'

const typeNotes = {
  manutencao: 'Use esta opção quando quiser estimar horas de equipe / terceiros, deslocamento e pequenos serviços de suporte.',
  equipamento: 'Ideal para equipamentos e peças: informe marca, modelo e descrição para habilitar sugestões inteligentes de máquinas e modelos.',
  civil: 'Para obras e serviços civis, detalhe área, qualidade de materiais e necessidade de alvarás.',
}

export default function PriceSimulatorPage() {
  const {
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
    resetForm,
    setEditableBreakdown,
    setResult,
    setLastSavedAt,
  } = usePriceSimulator()

  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-8 lg:px-8">
      <div className="w-full max-w-6xl self-center bg-white shadow rounded-lg p-6 space-y-4">
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold">Simulador de Preços</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-slate-500">Para líderes e engenheiros</span>
              <button
                type="button"
                onClick={saveDraft}
                disabled={savingDraft}
                className="text-xs rounded px-2 py-1 border border-slate-200 bg-white hover:bg-slate-50"
                title="Salvar rascunho agora no navegador (somente neste dispositivo)"
              >
                {savingDraft ? 'Salvando…' : 'Salvar rascunho'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = window.confirm('Deseja realmente limpar o rascunho salvo localmente? Isso removerá o estado salvo neste navegador.')
                  if (!ok) return
                  try {
                    // use the hook-provided helper to clear draft and reset state
                    clearDraft()
                  } catch (e) {
                    // ignore
                  }
                }}
                className="text-xs rounded px-2 py-1 border border-slate-200 bg-white hover:bg-slate-50"
                title="Remover rascunho salvo do navegador"
              >
                Limpar rascunho
              </button>
              {lastSavedAt && (
                <div className="relative group">
                  <div
                    className="flex items-center gap-2 text-xs text-emerald-600 cursor-default"
                    aria-label="Rascunho salvo no navegador"
                  >
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span>{formatSavedTime(lastSavedAt)}</span>
                  </div>
                  <div className="absolute right-0 mt-8 w-72 p-2 bg-white border border-slate-200 rounded shadow-lg text-[0.8rem] text-slate-700 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                    <div className="font-semibold text-xs text-slate-900">Rascunho salvo</div>
                    <div className="text-[0.8rem] text-slate-600 mt-1">
                      Este rascunho foi salvo localmente no seu navegador. Ele não é sincronizado entre dispositivos.
                      Use &ldquo;Limpar rascunho&rdquo; para remover o estado salvo.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm md:text-base text-slate-600">
            Simule o custo de manutenção, equipamentos ou projetos civis com base em contexto técnico real. Campos detalhados
            ajudam a comparar cenários reais sem abrir planilhas paralelas.
          </p>
          <p className="text-xs text-slate-500">Os dados vão direto para o endpoint `/api/price-simulator` (heurística ou IA).</p>
        </header>

        <div className="md:grid md:grid-cols-2 md:gap-6">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium">Tipo de serviço</label>
              <select
                id="tipo"
                title="Tipo de serviço"
                value={form.tipo}
                onChange={(e) => updateForm({ tipo: e.target.value as FormState['tipo'] })}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="manutencao">Manutenção geral</option>
                <option value="equipamento">Equipamento / Peça</option>
                <option value="civil">Civil / Obras</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">{typeNotes[form.tipo]}</p>
            </div>

            {/* Description moved later before submit; keep this section compact for flow */}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="storeSelect" className="block text-sm font-medium">Loja de referência (opcional)</label>
                  <select
                    id="storeSelect"
                    title="Loja de referência"
                    value={selectedStoreId}
                    onChange={(e) => handleStoreSelection(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2"
                  >
                  <option value="">Nenhuma (preencha manualmente)</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} {store.city ? `— ${store.city}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1 text-slate-500">
                  {storeLoading
                    ? 'Carregando catálogo de lojas...'
                    : storeError
                    ? storeError
                    : `${stores.length} lojas disponíveis para referência.`}
                </p>
              </div>

              <div>
                <label htmlFor="cidade" className="block text-sm font-medium">Cidade / Local</label>
                  <input
                    id="cidade"
                    type="text"
                    placeholder="Cidade ou local"
                    list={STORE_DATALIST_ID}
                    value={form.cidade}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                <datalist id={STORE_DATALIST_ID}>
                  {stores.map((store) => {
                    const value = store.city || store.name
                    const label = store.name && store.city ? `${store.name} — ${store.city}` : value
                    return <option key={store.id} value={value} label={label} />
                  })}
                </datalist>
              </div>
            </div>

            <div>
              <label htmlFor="complexidade" className="block text-sm font-medium">Complexidade / Qualidade</label>
              <select
                id="complexidade"
                title="Complexidade / Qualidade"
                value={form.complexidade}
                onChange={(e) => updateForm({ complexidade: e.target.value as FormState['complexidade'] })}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                {complexitySuggestion ? (
                  <>
                    <span>
                      Sugestão automática: {complexityLabelMap[complexitySuggestion.level]} — {complexitySuggestion.reason}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateForm({ complexidade: complexitySuggestion.level })}
                      className="underline text-sky-600"
                    >
                      Aplicar
                    </button>
                  </>
                ) : (
                  'A descrição informada não sugere alteração automática.'
                )}
              </div>
            </div>
          </section>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium">Descrição técnica resumida</label>
            <div className="mt-1 w-full">
              <textarea
                id="descricao"
                placeholder="Descreva resumidamente o serviço ou peça"
                value={form.descricao}
                onChange={(e) => updateForm({ descricao: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  className="px-3 py-1 rounded bg-sky-600 text-white text-sm"
                  disabled={generatingDescription}
                >
                  {generatingDescription ? 'Gerando...' : 'Preencher automaticamente'}
                </button>
                <button type="button" onClick={() => updateForm({ descricao: '' })} className="text-sm text-slate-600">
                  Limpar descrição
                </button>
                <div className="text-xs text-slate-500">Campo obrigatório (será solicitado se ficar em branco)</div>
              </div>
              {descriptionGenError && <div className="text-xs text-red-600 mt-1">{descriptionGenError}</div>}
            </div>
          </div>

          <section className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="quantidade" className="block text-sm font-medium">Quantidade de unidades</label>
              <input
                id="quantidade"
                type="number"
                placeholder="1"
                value={form.quantidade}
                min={1}
                onChange={(e) => updateForm({ quantidade: Number(e.target.value) })}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="estimativaEquipeHoras" className="block text-sm font-medium">Dias estimados de terceiros (opcional)</label>
              <input
                id="estimativaEquipeHoras"
                type="number"
                placeholder="1"
                  value={form.estimativaEquipeHoras}
                  min={0}
                  onChange={(e) => {
                    setHoursManuallyEdited(true)
                    updateForm({ estimativaEquipeHoras: Number(e.target.value) })
                  }}
                className="mt-1 w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use este campo para dar o contexto do que será terceirizado; informe em dias quando possível.
              </p>
              {suggestedHours !== null && (
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                  <span>
                    Sugestão automática: <strong>{suggestedHours} dias</strong> {hoursManuallyEdited ? '(editado pelo usuário)' : '(aplicada automaticamente)'}
                  </span>
                  {!hoursManuallyEdited && (
                    <button
                      type="button"
                      onClick={() => setSuggestedHours(null)}
                      className="text-xs text-slate-400"
                    >
                      Ignorar
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {form.tipo === 'equipamento' && (
            <section className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <h2 className="text-sm font-semibold uppercase text-slate-600">Detalhes do equipamento</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="anosUso" className="block text-sm font-medium">Anos estimados de uso</label>
                  <input
                    id="anosUso"
                    type="number"
                    placeholder="0"
                    value={form.anosUso}
                    min={0}
                    step={0.1}
                    onChange={(e) => updateForm({ anosUso: Number(e.target.value) })}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    1 ano equivale a cerca de {HOURS_PER_YEAR.toLocaleString('pt-BR')} horas operacionais.
                  </p>
                </div>
                <div>
                  <label htmlFor="equipamentoMarca" className="block text-sm font-medium">Marca</label>
                  <input
                    id="equipamentoMarca"
                    type="text"
                    placeholder="Marca do equipamento"
                    value={form.equipamentoMarca}
                    onChange={(e) => updateForm({ equipamentoMarca: e.target.value })}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="equipamentoModelo" className="block text-sm font-medium">Modelo</label>
                <input
                  id="equipamentoModelo"
                  type="text"
                  placeholder="Modelo do equipamento"
                  value={form.equipamentoModelo}
                  onChange={(e) => updateForm({ equipamentoModelo: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              {equipmentSuggestion && (
                <div className="text-xs text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-600">{equipmentSuggestion.title}</p>
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-wide text-slate-500">Marcas sugeridas</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {equipmentSuggestion.brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          className="rounded-full border border-slate-200 px-2 py-1 text-[0.7rem] text-slate-600 hover:bg-slate-100"
                          onClick={() => updateForm({ equipamentoMarca: brand })}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-wide text-slate-500">Modelos sugeridos</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {equipmentSuggestion.models.map((model) => (
                        <button
                          key={model}
                          type="button"
                          className="rounded-full border border-slate-200 px-2 py-1 text-[0.7rem] text-slate-600 hover:bg-slate-100"
                          onClick={() => updateForm({ equipamentoModelo: model })}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {form.tipo === 'civil' && (
            <section className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <h2 className="text-sm font-semibold uppercase text-slate-600">Parâmetros civis / materiais</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="area_m2" className="block text-sm font-medium">Área (m²)</label>
                  <input
                    id="area_m2"
                    type="number"
                    placeholder="0"
                    value={form.area_m2}
                    min={0}
                    onChange={(e) => updateForm({ area_m2: Number(e.target.value) })}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="materialQualidade" className="block text-sm font-medium">Qualidade do material</label>
                  <select
                    id="materialQualidade"
                    title="Qualidade do material"
                    value={form.materialQualidade}
                    onChange={(e) => updateForm({ materialQualidade: e.target.value as FormState['materialQualidade'] })}
                    className="mt-1 w-full border rounded px-3 py-2"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="alvaraCheck"
                  type="checkbox"
                  checked={form.precisaAlvara}
                  onChange={(e) => updateForm({ precisaAlvara: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="alvaraCheck" className="text-sm font-medium">
                  Precisa de alvará / licença
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Marque esta opção para estimativas que exigem autorizações especiais (obra, operação com equipamentos).
              </p>
              <div className="mt-3">
                <div className="text-sm font-medium text-slate-700">Itens civis rápidos</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CIVIL_COMMON_ITEMS.map((it) => (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => addCivilItemToBreakdown(it)}
                      className="rounded border border-slate-200 px-2 py-1 text-[0.8rem] bg-white hover:bg-slate-50"
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Clique para adicionar o item ao detalhamento com estimativa baseada na área e parâmetros.</p>
              </div>
            </section>
          )}

          {form.tipo === 'manutencao' && (
            <section className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h2 className="text-sm font-semibold uppercase text-slate-600">Observações de manutenção</h2>
              <p className="text-sm text-slate-600">
                Detalhe as horas de equipe / terceiros e contexto. A heurística considera quantidades e horas diretamente
                para este tipo.
              </p>
            </section>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {loading ? 'Calculando...' : 'Calcular estimativa'}
            </button>
            <button type="button" className="text-sm text-slate-600" onClick={resetForm}>
              Limpar campos
            </button>
          </div>
        </form>

            {/* Clarification modal overlay - collects extra questions for AI */}
            {showClarifyModal && (
              <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowClarifyModal(false)} />
                <div className="relative z-10 max-w-3xl w-full bg-white rounded shadow-lg p-6">
                  <h3 className="text-lg font-semibold">Perguntas rápidas para melhorar a estimativa</h3>
                  <p className="text-sm text-slate-600 mt-1">Algumas perguntas extras ajudam a IA a dar um valor mais preciso.</p>

                  {/* Missing description prompt: when description is empty, ask the user a short summary before calculating */}
                  {!form.descricao && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium">Resumo rápido do que deseja executar (obrigatório)</label>
                      <textarea
                        placeholder="Descreva em 1-2 frases o serviço/peça"
                        value={String(clarifyAnswers.missingDescription ?? '')}
                        onChange={(e) => updateClarify({ missingDescription: e.target.value })}
                        className="mt-1 w-full border rounded px-3 py-2"
                        rows={3}
                      />
                      {form.tipo === 'civil' && (
                        <div className="text-xs text-slate-500 mt-2">
                          Observação: para obras civis no Brasil, informe estimativa em dias (não em horas).
                          <div className="mt-1 flex items-center gap-2">
                            <label className="text-xs">Dias estimados de terceiros (opcional):</label>
                            <input
                              id="daysForThirdParty"
                              type="number"
                              min={0}
                              placeholder="0"
                              title="Dias estimados de terceiros"
                              value={clarifyAnswers.daysForThirdParty ?? ''}
                              onChange={(e) => updateClarify({ daysForThirdParty: e.target.value === '' ? '' : Number(e.target.value) })}
                              className="w-24 ml-2 rounded border px-2 py-1 text-xs"
                            />
                            <span className="text-[0.7rem] text-slate-400">(serão convertidos para horas: dias × 8h)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic questions by type */}
                  <div className="mt-4 space-y-3 text-sm">
                    {form.tipo === 'civil' && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(clarifyAnswers.includeHydraulica)}
                            onChange={(e) => updateClarify({ includeHydraulica: e.target.checked })}
                          />
                          Incluir serviços hidráulicos?
                        </label>
                        {clarifyAnswers.includeHydraulica && (
                          <div className="grid md:grid-cols-2 gap-2">
                            <label className="text-xs">
                              Quantos pontos hidráulicos?
                              <input
                                type="number"
                                min={0}
                                value={clarifyAnswers.hydraulicPoints ?? ''}
                                onChange={(e) => updateClarify({ hydraulicPoints: Number(e.target.value) })}
                                className="mt-1 w-full border rounded px-2 py-1"
                              />
                            </label>
                            <label className="text-xs">
                              Incluir remoção / bota-fora?
                              <select
                                title="Incluir remoção / bota-fora"
                                value={clarifyAnswers.includeDisposal ? 'yes' : 'no'}
                                onChange={(e) => updateClarify({ includeDisposal: e.target.value === 'yes' })}
                                className="mt-1 w-full border rounded px-2 py-1"
                              >
                                <option value="no">Não</option>
                                <option value="yes">Sim</option>
                              </select>
                            </label>
                          </div>
                        )}

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(clarifyAnswers.includeEletrica)}
                            onChange={(e) => updateClarify({ includeEletrica: e.target.checked })}
                          />
                          Incluir serviços elétricos?
                        </label>
                        {clarifyAnswers.includeEletrica && (
                          <div>
                            <label className="text-xs">
                              Quantos pontos elétricos?
                              <input
                                type="number"
                                min={0}
                                value={clarifyAnswers.electricPoints ?? ''}
                                onChange={(e) => updateClarify({ electricPoints: Number(e.target.value) })}
                                className="mt-1 w-full border rounded px-2 py-1"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {form.tipo === 'equipamento' && (
                      <div className="space-y-2">
                        <label className="text-xs">Equipamento inclui garantia estendida?</label>
                        <select
                          title="Garantia estendida"
                          value={clarifyAnswers.warranty ? 'yes' : 'no'}
                          onChange={(e) => updateClarify({ warranty: e.target.value === 'yes' })}
                          className="mt-1 w-48 border rounded px-2 py-1"
                        >
                          <option value="no">Não</option>
                          <option value="yes">Sim</option>
                        </select>
                      </div>
                    )}

                    {form.tipo === 'manutencao' && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(clarifyAnswers.requiresShutdown)}
                            onChange={(e) => updateClarify({ requiresShutdown: e.target.checked })}
                          />
                          Requer parada/interruptão da operação?
                        </label>
                        {clarifyAnswers.requiresShutdown && (
                          <label className="text-xs">
                            Duração estimada da parada (horas)
                            <input
                              type="number"
                              min={0}
                              value={clarifyAnswers.shutdownHours ?? ''}
                              onChange={(e) => updateClarify({ shutdownHours: Number(e.target.value) })}
                              className="mt-1 w-40 border rounded px-2 py-1"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-3 justify-end">
                    <button type="button" onClick={() => setShowClarifyModal(false)} className="px-3 py-2 rounded border">
                      Voltar
                    </button>
                    <button type="button" onClick={confirmAndSubmit} className="px-3 py-2 rounded bg-sky-600 text-white">
                      Confirmar e calcular
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          <aside className="mt-4 md:mt-0">
            <div className="md:sticky md:top-6" aria-live="polite">
          {error && <div className="text-red-600 text-sm">Erro: {error}</div>}
          {!error && !result && (
            <div className="text-sm text-slate-500">Preencha os dados acima e clique em Calcular para obter a estimativa.</div>
          )}
          {result && (
            <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Resultado</div>
                <span className="text-xs text-slate-500">{result.source ?? 'Heurística'}</span>
              </div>
              {/* Scenario selector (if API returned multiple scenarios) */}
              {Array.isArray(result.scenarios) && result.scenarios.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {result.scenarios.map((s: any, idx: number) => (
                    <button
                      key={s.name || idx}
                      type="button"
                      onClick={() => {
                        setSelectedScenarioIndex(idx)
                        // reset editable breakdown to selected scenario (clears manual edits)
                        setEditableBreakdown((s.breakdown || []).map((b: any) => ({ label: b.label, amount: Number(b.amount) || 0 })))
                      }}
                      className={`px-2 py-1 rounded text-xs ${selectedScenarioIndex === idx ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-800'}`}
                    >
                      {s.name || `cenário ${idx + 1}`} — {currencyFormatter.format(s.estimate)}
                    </button>
                  ))}
                </div>
              )}
              <div className="text-4xl md:text-5xl font-bold">{currencyFormatter.format(displayEstimate ?? 0)}</div>
              {result.details && <p className="text-sm text-slate-600">{result.details}</p>}
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>{searchSummary}</p>
                <p>Fonte: {result.source ?? 'Heurística'}</p>
                {Array.isArray(result.sources) && result.sources.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowSources((s) => !s)}
                      className="text-xs underline text-slate-600"
                    >
                      {showSources ? 'Ocultar fontes' : `Ver fontes (${result.sources.length})`}
                    </button>
                    {showSources && (
                      <div className="mt-2 space-y-2 text-xs text-slate-700">
                        {result.sources.map((src: any, i: number) => (
                          <div key={i} className="p-2 border rounded bg-white">
                            <div className="font-semibold text-[0.85rem]">{src.title ?? src.name ?? `Fonte ${i + 1}`}</div>
                            {src.url && (
                              <div>
                                <a href={src.url} target="_blank" rel="noreferrer" className="text-sky-600 text-[0.8rem]">
                                  {src.url}
                                </a>
                              </div>
                            )}
                            {src.snippet && <div className="mt-1 text-[0.85rem] text-slate-600">{src.snippet}</div>}
                            {src.relevance != null && (
                              <div className="mt-1 text-[0.7rem] text-slate-500">Relevância: {Math.round(Number(src.relevance) * 100)}%</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Detalhamento</div>
                <ul className="mt-2 divide-y divide-slate-200 text-sm">
                  {Array.isArray(detailsToShow) && detailsToShow.length > 0 ? (
                    detailsToShow.map((it: any, idx: number) => (
                      <li key={idx} className="flex justify-between py-2">
                        <span>{it.label}</span>
                        <span>{currencyFormatter.format(it.amount)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="py-2 text-slate-500">Sem detalhamento disponível</li>
                  )}
              </ul>
            </div>
            <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Ajustar detalhamento</span>
                <span className="text-xs text-slate-500">
                  Total ajustado:{' '}
                  <strong>{currencyFormatter.format(displayEstimate ?? 0)}</strong>
                </span>
              </div>
              <div className="space-y-2">
                {editableBreakdown.length > 0 ? (
                  editableBreakdown.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        aria-label={`Detalhamento ${idx + 1} - descrição`}
                        placeholder={`Item ${idx + 1}`}
                        value={item.label}
                        onChange={(e) => handleBreakdownChange(idx, 'label', e.target.value)}
                        className="flex-1 min-w-[120px] rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        aria-label={`Detalhamento ${idx + 1} - valor`}
                        placeholder="0"
                        value={item.amount !== undefined ? item.amount : ''}
                        onChange={(e) => handleBreakdownChange(idx, 'amount', e.target.value)}
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBreakdownItem(idx)}
                        className="text-xs text-red-600 underline-offset-2 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Nenhum ajuste manual feito ainda.</p>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-[2fr,1fr,auto]">
                <input
                  type="text"
                  value={newBreakdownLabel}
                  onChange={(e) => setNewBreakdownLabel(e.target.value)}
                  placeholder="Novo item (ex.: logística, deslocamento)"
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={newBreakdownAmount}
                  onChange={(e) => setNewBreakdownAmount(e.target.value)}
                  placeholder="Valor"
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddBreakdownItem}
                  className="rounded bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <label className="flex items-center gap-2">
                  <span>Valor de tabela</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tableReference}
                    onChange={(e) => setTableReference(e.target.value)}
                    placeholder="R$"
                    className="w-32 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </label>
                {tableReferenceValue > 0 && (
                  <span
                    className={`text-[0.7rem] font-semibold ${
                      isBelowTable ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isBelowTable
                      ? 'Estimativa muito abaixo da tabela informada.'
                      : 'Estimativa dentro da faixa de tabela informada.'}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-amber-500 text-white text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleGenerateNanoBanana}
                disabled={nanoBanana.loading}
              >
                {nanoBanana.loading ? 'Gerando Nano Banana...' : 'Gerar Nano Banana'}
              </button>
              {nanoBanana.prompt && (
                <span className="text-[0.65rem] text-slate-500">Prompt usado: {nanoBanana.prompt}</span>
              )}
            </div>
            {nanoBanana.error && <p className="text-xs text-red-600">{nanoBanana.error}</p>}
            {nanoBanana.image && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-white p-2">
                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-amber-600">Planta Nano Banana</div>
                <div className="mt-2">
                  {/* Dynamic image (data URL / external) provided by AI; next/image may
                      break for data URLs or unknown external hosts — keep <img> here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nanoBanana.image}
                    alt="Planta baixa gerada"
                    className="w-full max-h-80 object-contain rounded"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            <div className="mt-4 rounded border border-amber-100 bg-amber-50 p-4 space-y-3">
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">{sapHeader}</div>
              <p className="text-xs text-amber-800">{sapJustification}</p>
              <div>
                <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-600">Descrição SAP sugerida</div>
                <p className="text-sm text-slate-800">{uppercaseDescription}</p>
              </div>
              <div>
                <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-600">Valor sugerido para SAP</div>
                <p className="text-xl font-bold text-slate-800">{currencyFormatter.format(displayEstimate ?? result?.estimate ?? 0)}</p>
              </div>
            </div>
            </div>
          )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
