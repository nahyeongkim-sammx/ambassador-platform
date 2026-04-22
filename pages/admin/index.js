import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminAuth } from '../../lib/useAdminAuth'
import Head from 'next/head'
import * as XLSX from 'xlsx'

export default function AdminDashboard() {
  const { session, loading: authLoading, logout } = useAdminAuth()

  const [applications, setApplications] = useState([])
  const [ambassadors, setAmbassadors] = useState([])
  const [currentMonth, setCurrentMonth] = useState('')
  const [deadline, setDeadline] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('applications')
  const [savingDeadline, setSavingDeadline] = useState(false)
  const [newMonth, setNewMonth] = useState('')

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    setLoading(true)
    const [settingsRes, ambassadorsRes] = await Promise.all([
      supabase.from('settings').select('key,value'),
      supabase.from('ambassadors').select('*'),
    ])

    let month = ''
    if (settingsRes.data) {
      const dl = settingsRes.data.find(r => r.key === 'deadline')?.value || ''
      month = settingsRes.data.find(r => r.key === 'current_month')?.value || ''
      setDeadline(dl)
      setDeadlineInput(dl)
      setCurrentMonth(month)
      setNewMonth(month)
    }

    if (ambassadorsRes.data) setAmbassadors(ambassadorsRes.data)

    if (month) {
      const { data: apps } = await supabase
        .from('applications')
        .select(`
          id, month, real_name, submitted_at,
          product1:products!applications_product1_id_fkey(id, name, sku),
          product2:products!applications_product2_id_fkey(id, name, sku)
        `)
        .eq('month', month)
        .order('submitted_at', { ascending: false })
      if (apps) setApplications(apps)
    }

    setLoading(false)
  }

  async function loadMonthData(month) {
    const { data: apps } = await supabase
      .from('applications')
      .select(`
        id, month, real_name, submitted_at,
        product1:products!applications_product1_id_fkey(id, name, sku),
        product2:products!applications_product2_id_fkey(id, name, sku)
      `)
      .eq('month', month)
      .order('submitted_at', { ascending: false })
    if (apps) setApplications(apps)
  }

  async function saveDeadline() {
    setSavingDeadline(true)
    await supabase.from('settings').upsert({ key: 'deadline', value: deadlineInput })
    setDeadline(deadlineInput)
    setSavingDeadline(false)
    alert('마감일이 저장되었습니다.')
  }

  async function saveMonth() {
    await supabase.from('settings').upsert({ key: 'current_month', value: newMonth })
    setCurrentMonth(newMonth)
    await loadMonthData(newMonth)
    alert(`${newMonth}월로 변경되었습니다.`)
  }

  function getAmbassadorInfo(realName) {
    return ambassadors.find(a => a.real_name === realName) || {}
  }

  function exportExcel() {
    const rows = applications.map(app => {
      const amb = getAmbassadorInfo(app.real_name)
      return {
        '본명': app.real_name,
        '인스타그램': amb.instagram || '',
        '연락처': amb.phone || '',
        '우편번호': amb.zipcode || '',
        '주소': amb.address || '',
        '상세주소': amb.address_detail || '',
        '무상제품1': app.product1?.name || '',
        '무상제품1 전산명': app.product1?.sku || '',
        '무상제품2': app.product2?.name || '',
        '무상제품2 전산명': app.product2?.sku || '',
        '신청일시': new Date(app.submitted_at).toLocaleString('ko-KR'),
      }
    })

    // 미신청 앰버서더도 추가
    const submittedNames = new Set(applications.map(a => a.real_name))
    ambassadors.forEach(amb => {
      if (!submittedNames.has(amb.real_name)) {
        rows.push({
          '성함': amb.real_name,
          '인스타그램 계정': amb.instagram || '',
          '연락처': amb.phone || '',
          '우편번호': amb.zipcode || '',
          '주소': amb.address || '',
          '상세주소': amb.address_detail || '',
          '무상제품1': '미신청',
          '무상제품1 전산명': '',
          '무상제품2': '미신청',
          '무상제품2 전산명': '',
          '신청일시': '',
        })
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${currentMonth} 신청내역`)
    XLSX.writeFile(wb, `삼대오백_앰버서더_${currentMonth}_무상제품신청.xlsx`)
  }

  const submittedCount = applications.length
  const totalCount = ambassadors.length
  const notSubmitted = ambassadors.filter(a => !applications.find(app => app.real_name === a.real_name))

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">로딩 중...</p></div>
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>어드민 | 삼대오백 앰버서더 허브</title></Head>

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-orange-500 font-bold text-lg">삼대오백</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 text-sm">앰버서더 허브 | 어드민 대시보드</span>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          로그아웃
        </button>
      </header>

      {/* Tab nav */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-0">
          {[['applications', '신청 현황'], ['settings', '설정'], ['ambassadors', '앰버서더 명단']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ===== 신청 현황 탭 ===== */}
        {tab === 'applications' && (
          <div>
            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                ['신청 완료', submittedCount, 'text-green-600'],
                ['미신청', totalCount - submittedCount, 'text-red-500'],
                ['전체 앰버서더', totalCount, 'text-gray-900'],
              ].map(([label, value, color]) => (
                <div key={label} className="bg-white rounded-xl border p-5">
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value}<span className="text-base font-normal text-gray-400 ml-1">명</span></p>
                </div>
              ))}
            </div>

            {/* 월 선택 + 엑셀 다운로드 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <select
                  value={currentMonth}
                  onChange={e => { setCurrentMonth(e.target.value); loadMonthData(e.target.value) }}
                  className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {/* 최근 6개월 */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    return <option key={val} value={val}>{val}</option>
                  })}
                </select>
                <span className="text-gray-400 text-sm">기준</span>
              </div>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                엑셀 다운로드
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">불러오는 중...</div>
            ) : (
              <>
                {/* 신청 완료 목록 */}
                <div className="bg-white rounded-xl border overflow-hidden mb-6">
                  <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 text-sm">신청 완료 ({submittedCount}명)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="px-4 py-3 text-left text-gray-500 font-medium">본명</th>
                          <th className="px-4 py-3 text-left text-gray-500 font-medium">무상제품 1</th>
                          <th className="px-4 py-3 text-left text-gray-500 font-medium">무상제품 2</th>
                          <th className="px-4 py-3 text-left text-gray-500 font-medium">연락처</th>
                          <th className="px-4 py-3 text-left text-gray-500 font-medium">신청일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app, i) => {
                          const amb = getAmbassadorInfo(app.real_name)
                          return (
                            <tr key={app.id} className={`border-b last:border-b-0 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                              <td className="px-4 py-3 font-medium text-gray-900">{app.real_name}</td>
                              <td className="px-4 py-3 text-gray-700">
                                <div>{app.product1?.name}</div>
                                {app.product1?.sku && <div className="text-xs text-gray-400">{app.product1.sku}</div>}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <div>{app.product2?.name}</div>
                                {app.product2?.sku && <div className="text-xs text-gray-400">{app.product2.sku}</div>}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{amb.phone || '-'}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(app.submitted_at).toLocaleString('ko-KR')}</td>
                            </tr>
                          )
                        })}
                        {applications.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">신청 내역이 없습니다.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 미신청 목록 */}
                {notSubmitted.length > 0 && (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-5 py-3 bg-red-50 border-b">
                      <h3 className="font-semibold text-red-600 text-sm">미신청 ({notSubmitted.length}명)</h3>
                    </div>
                    <div className="divide-y">
                      {notSubmitted.map(amb => (
                        <div key={amb.id} className="px-5 py-3 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700 text-sm">{amb.real_name}</span>
                            {amb.instagram && <span className="text-gray-400 text-xs ml-2">@{amb.instagram}</span>}
                          </div>
                          <span className="text-xs text-gray-400">{amb.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== 설정 탭 ===== */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">신청 마감일 설정</h3>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={deadlineInput}
                  onChange={e => setDeadlineInput(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  onClick={saveDeadline}
                  disabled={savingDeadline}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  저장
                </button>
              </div>
              {deadline && <p className="mt-2 text-gray-400 text-xs">현재: {deadline}</p>}
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">신청 월 설정</h3>
              <p className="text-gray-500 text-xs mb-3">앰버서더 플랫폼에 표시될 신청 월을 설정합니다.</p>
              <div className="flex gap-3">
                <input
                  type="month"
                  value={newMonth}
                  onChange={e => setNewMonth(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  onClick={saveMonth}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  변경
                </button>
              </div>
              {currentMonth && <p className="mt-2 text-gray-400 text-xs">현재: {currentMonth}</p>}
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">앰버서더 플랫폼 URL</h3>
              <p className="text-gray-500 text-xs mb-3">아래 URL을 앰버서더들에게 DM으로 발송하세요.</p>
              <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
                {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}
              </div>
            </div>
          </div>
        )}

        {/* ===== 앰버서더 명단 탭 ===== */}
        {tab === 'ambassadors' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm">총 {ambassadors.length}명 | 배송정보 포함</p>
              <a href="/admin/ambassadors-upload" className="text-orange-500 text-sm hover:underline">
                → 엑셀로 업로드
              </a>
            </div>
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">성함</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">인스타그램</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">연락처</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">주소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambassadors.map((amb, i) => (
                      <tr key={amb.id} className={`border-b last:border-b-0 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{amb.real_name}</td>
                        <td className="px-4 py-3 text-gray-500">@{amb.instagram || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{amb.phone || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{amb.address} {amb.address_detail}</td>
                      </tr>
                    ))}
                    {ambassadors.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">앰버서더 데이터가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
