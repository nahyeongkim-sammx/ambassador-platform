import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'
import Image from 'next/image'

export default function Home() {
  const [step, setStep] = useState(1) // 1:이름입력 2:제품선택 3:완료
  const [deadline, setDeadline] = useState(null)
  const [isExpired, setIsExpired] = useState(false)
  const [currentMonth, setCurrentMonth] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [ambassador, setAmbassador] = useState(null)
  const [nameError, setNameError] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState([]) // max 2
  const [cat1, setCat1] = useState('')
  const [cat2, setCat2] = useState('')
  const [cat3, setCat3] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    loadSettings()
    loadProducts()
  }, [])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key,value')
    if (!data) return
    const dl = data.find(r => r.key === 'deadline')?.value
    const month = data.find(r => r.key === 'current_month')?.value
    if (dl) {
      setDeadline(dl)
      setIsExpired(new Date() > new Date(dl + 'T23:59:59'))
    }
    if (month) setCurrentMonth(month)
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('category1,category2,category3,name')
    if (data) setProducts(data)
  }

  // 카테고리 유니크값
  const cat1List = [...new Set(products.map(p => p.category1))].filter(Boolean)
  const cat2List = [...new Set(
    products.filter(p => !cat1 || p.category1 === cat1).map(p => p.category2)
  )].filter(Boolean)
  const cat3List = [...new Set(
    products.filter(p => (!cat1 || p.category1 === cat1) && (!cat2 || p.category2 === cat2)).map(p => p.category3)
  )].filter(Boolean)

  const filteredProducts = products.filter(p => {
    if (cat1 && p.category1 !== cat1) return false
    if (cat2 && p.category2 !== cat2) return false
    if (cat3 && p.category3 !== cat3) return false
    return true
  })

  async function handleNameSubmit() {
    if (!nameInput.trim()) { setNameError('이름을 입력해주세요.'); return }
    setNameLoading(true)
    setNameError('')

    // 앰버서더 확인
    const { data: amb } = await supabase
      .from('ambassadors')
      .select('*')
      .eq('real_name', nameInput.trim())
      .single()

    if (!amb) {
      setNameError('등록된 앰버서더가 아닙니다. 정확한 본명을 입력해주세요.')
      setNameLoading(false)
      return
    }

    // 이미 제출했는지 확인
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('month', currentMonth)
      .eq('real_name', nameInput.trim())
      .single()

    if (existing) {
      setAlreadySubmitted(true)
      setAmbassador(amb)
      setStep(3)
      setNameLoading(false)
      return
    }

    setAmbassador(amb)
    setStep(2)
    setNameLoading(false)
  }

  function toggleProduct(product) {
    if (selected.find(s => s.id === product.id)) {
      setSelected(selected.filter(s => s.id !== product.id))
    } else {
      if (selected.length >= 2) return
      setSelected([...selected, product])
    }
  }

  async function handleSubmit() {
    if (selected.length !== 2) return
    setSubmitting(true)

    const { error } = await supabase.from('applications').insert({
      month: currentMonth,
      real_name: ambassador.real_name,
      ambassador_id: ambassador.id,
      product1_id: selected[0].id,
      product2_id: selected[1].id,
    })

    if (error) {
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.')
      setSubmitting(false)
      return
    }

    setStep(3)
    setSubmitting(false)
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <Head><title>삼대오백 앰버서더 무상제품 신청</title></Head>
        <div className="text-center">
          <div className="text-5xl mb-6">⏰</div>
          <h2 className="text-2xl font-bold text-white mb-3">신청 마감되었습니다</h2>
          <p className="text-gray-400">이번 달 신청 기간이 종료되었습니다.<br/>다음 달에 다시 신청해주세요.</p>
          {deadline && <p className="text-gray-600 text-sm mt-4">마감일: {deadline}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <Head>
        <title>삼대오백 앰버서더 무상제품 신청</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0d0d0d]/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#FF5A1F] text-xs font-semibold tracking-widest uppercase mb-0.5">Ambassador</p>
            <h1 className="text-white font-bold text-lg leading-tight">삼대오백 무상제품 신청</h1>
          </div>
          {currentMonth && (
            <span className="bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full">
              {currentMonth.replace('-', '년 ')}월
            </span>
          )}
        </div>
      </header>

      {/* Step indicator */}
      {step < 3 && (
        <div className="max-w-2xl mx-auto px-5 py-5">
          <div className="flex items-center gap-2">
            {[['01', '본인 확인'], ['02', '제품 선택']].map(([num, label], i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${step === i + 1 ? 'opacity-100' : step > i + 1 ? 'opacity-60' : 'opacity-30'}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-[#FF5A1F]' : step === i + 1 ? 'bg-white text-black' : 'bg-white/20'}`}>
                    {step > i + 1 ? '✓' : num}
                  </span>
                  <span className="text-sm text-gray-300 hidden sm:block">{label}</span>
                </div>
                {i < 1 && <div className="w-8 h-px bg-white/20 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-5 pb-24">

        {/* STEP 1: 이름 입력 */}
        {step === 1 && (
          <div className="pt-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">본인 확인</h2>
              <p className="text-gray-400 text-sm">가입 시 등록한 본명(실명)을 입력해주세요.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">본명 (실명)</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value); setNameError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                  placeholder="홍길동"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-[#FF5A1F] focus:bg-white/8 transition-all"
                />
                {nameError && <p className="mt-2 text-red-400 text-sm">{nameError}</p>}
              </div>

              <button
                onClick={handleNameSubmit}
                disabled={nameLoading}
                className="w-full bg-[#FF5A1F] hover:bg-[#D94A14] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                {nameLoading ? '확인 중...' : '다음 →'}
              </button>
            </div>

            {deadline && (
              <p className="mt-6 text-center text-gray-600 text-xs">
                신청 마감일: <span className="text-gray-400">{deadline}</span>
              </p>
            )}
          </div>
        )}

        {/* STEP 2: 제품 선택 */}
        {step === 2 && (
          <div className="pt-2">
            <div className="mb-6">
              <p className="text-[#FF5A1F] text-sm font-semibold mb-1">{ambassador?.real_name}님 안녕하세요 👋</p>
              <h2 className="text-2xl font-bold mb-1">무상제품 선택</h2>
              <p className="text-gray-400 text-sm">원하는 제품을 <span className="text-white font-semibold">2개</span> 선택해주세요.</p>
            </div>

            {/* 선택된 제품 표시 */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              {[0, 1].map(i => (
                <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${selected[i] ? 'border-[#FF5A1F]/50 bg-[#FF5A1F]/8' : 'border-white/10 bg-white/3'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${selected[i] ? 'bg-[#FF5A1F] text-white' : 'bg-white/10 text-gray-500'}`}>
                    {i + 1}
                  </div>
                  {selected[i] ? (
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{selected[i].name}</p>
                      <button onClick={() => toggleProduct(selected[i])} className="text-gray-500 text-xs hover:text-red-400">취소</button>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs">미선택</p>
                  )}
                </div>
              ))}
            </div>

            {/* 카테고리 필터 */}
            <div className="space-y-3 mb-5">
              {/* Cat1 */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => { setCat1(''); setCat2(''); setCat3('') }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!cat1 ? 'bg-[#FF5A1F] text-white' : 'bg-white/8 text-gray-400 hover:bg-white/12'}`}
                >
                  전체
                </button>
                {cat1List.map(c => (
                  <button
                    key={c}
                    onClick={() => { setCat1(c); setCat2(''); setCat3('') }}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${cat1 === c ? 'bg-[#FF5A1F] text-white' : 'bg-white/8 text-gray-400 hover:bg-white/12'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Cat2 */}
              {cat2List.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pl-2">
                  <button
                    onClick={() => { setCat2(''); setCat3('') }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!cat2 ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                  >
                    전체
                  </button>
                  {cat2List.map(c => (
                    <button
                      key={c}
                      onClick={() => { setCat2(c); setCat3('') }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${cat2 === c ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* Cat3 */}
              {cat3List.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pl-4">
                  <button
                    onClick={() => setCat3('')}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-all ${!cat3 ? 'bg-white/15 text-gray-300' : 'bg-white/5 text-gray-600 hover:bg-white/8'}`}
                  >
                    전체
                  </button>
                  {cat3List.map(c => (
                    <button
                      key={c}
                      onClick={() => setCat3(c)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-all ${cat3 === c ? 'bg-white/15 text-gray-300' : 'bg-white/5 text-gray-600 hover:bg-white/8'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 제품 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {filteredProducts.map(product => {
                const isSelected = !!selected.find(s => s.id === product.id)
                const isDisabled = !isSelected && selected.length >= 2

                return (
                  <button
                    key={product.id}
                    onClick={() => !isDisabled && toggleProduct(product)}
                    disabled={isDisabled}
                    className={`product-card relative rounded-2xl overflow-hidden text-left transition-all ${isSelected ? 'selected' : ''} ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* 제품 이미지 */}
                    <div className="aspect-square bg-white/5 relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* 선택 표시 */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#FF5A1F]/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">
                              {selected.findIndex(s => s.id === product.id) + 1}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 제품 정보 */}
                    <div className="p-3 bg-white/5">
                      {product.category2 && (
                        <p className="text-[#FF5A1F] text-[10px] font-semibold uppercase tracking-wide mb-1">
                          {product.category2}
                        </p>
                      )}
                      <p className="text-white text-xs font-medium leading-tight line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                해당 카테고리에 제품이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* STEP 3: 완료 */}
        {step === 3 && (
          <div className="pt-8 text-center">
            {alreadySubmitted ? (
              <>
                <div className="text-5xl mb-6">✅</div>
                <h2 className="text-2xl font-bold mb-3">이미 신청 완료되었습니다</h2>
                <p className="text-gray-400">{ambassador?.real_name}님은 이번 달 신청을 완료하셨습니다.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-[#FF5A1F]/20 border-2 border-[#FF5A1F] flex items-center justify-center mx-auto mb-6">
                  <span className="text-[#FF5A1F] text-3xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">신청 완료!</h2>
                <p className="text-gray-400 mb-5">무상제품 신청이 완료되었습니다.<br/>배송 시 등록된 주소로 발송됩니다.</p>

                <div className="bg-yellow-950/30 border border-yellow-600/40 rounded-2xl p-5 text-left mb-8 max-w-sm mx-auto">
                  <p className="text-yellow-400 text-xs font-semibold mb-2">
                    ⚠️ 주소 변경 안내 ⚠️
                  </p>
                  <p className="text-yellow-200/80 text-xs leading-relaxed">
                    배송주소 변경 시, 사전에 DM을 통해 요청해 주셔야 합니다.<br/>
                    변경 주소 미 전달로 인한 오배송에 대해서는 제품 재발송이 어려운 점 참고 부탁 드립니다.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3 max-w-sm mx-auto">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">신청 내역</p>
                  {selected.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="text-white text-sm">{p.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 하단 고정 버튼 (step 2) */}
      {step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 border-t border-white/10 backdrop-blur p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={selected.length !== 2 || submitting}
              className="w-full bg-[#FF5A1F] hover:bg-[#D94A14] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base"
            >
              {submitting ? '제출 중...' : selected.length === 2 ? '신청하기 →' : `제품 ${2 - selected.length}개 더 선택하세요`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
