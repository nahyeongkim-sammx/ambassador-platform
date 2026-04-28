import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminAuth } from '../../lib/useAdminAuth'
import Head from 'next/head'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function AmbassadorsUpload() {
  const { session, loading: authLoading } = useAdminAuth()
  const [preview, setPreview] = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  function handleFile(file) {
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws)
      setPreview(data)
    }
    reader.readAsBinaryString(file)
  }

  async function handleUpload() {
    if (!preview.length) return
    setUploading(true)

    // 컬럼 매핑: 엑셀 헤더 → DB 컬럼
    const rows = preview.map(row => ({
      real_name: row['본명'] || row['이름'] || '',
      instagram: row['인스타그램'] || row['instagram'] || '',
      phone: String(row['연락처'] || row['전화번호'] || ''),
      email: row['이메일'] || row['email'] || '',
      zipcode: String(row['우편번호'] || ''),
      address: row['주소'] || '',
      address_detail: row['상세주소'] || '',
    })).filter(r => r.real_name)

    const { error } = await supabase
      .from('ambassadors')
      .upsert(rows, { onConflict: 'real_name' })

    setUploading(false)
    if (error) {
      setResult({ success: false, message: '업로드 실패: ' + error.message })
    } else {
      // 업로드 날짜 저장
      await supabase.from('settings').upsert({ key: 'last_ambassador_upload', value: new Date().toISOString() })
      setResult({ success: true, message: `${rows.length}명 업로드 완료! (중복 본명은 덮어쓰기 됩니다)` })
    }
  }

  function downloadTemplate() {
    const template = [{ '본명': '홍길동', '인스타그램': 'honggildong', '연락처': '01012345678', '이메일': 'hong@email.com', '우편번호': '06000', '주소': '서울시 강남구 테헤란로 123', '상세주소': '456호' }]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '앰버서더')
    XLSX.writeFile(wb, '앰버서더_업로드_템플릿.xlsx')
  }

  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">로딩 중...</p></div>
  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>앰버서더 업로드 | 어드민</title></Head>

      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-orange-500 font-bold">삼대오백</Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 text-sm">앰버서더 엑셀 업로드</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-1">엑셀로 앰버서더 명단 업로드</h2>
          <p className="text-gray-500 text-sm mb-4">기존 Google Sheets / 엑셀에서 데이터를 그대로 업로드하세요.</p>

          <div className="flex gap-3 mb-6">
            <button onClick={downloadTemplate} className="border border-orange-300 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50">
              📥 템플릿 다운로드
            </button>
          </div>

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <p className="text-gray-400 text-sm">엑셀 파일을 클릭하거나 드래그해서 업로드</p>
            <p className="text-gray-300 text-xs mt-1">.xlsx / .xls / .csv 지원</p>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="bg-white rounded-2xl border p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">미리보기 ({preview.length}명)</h3>
              <button onClick={handleUpload} disabled={uploading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-bold">
                {uploading ? '업로드 중...' : '업로드 실행'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {Object.keys(preview[0]).map(k => (
                      <th key={k} className="px-3 py-2 text-left text-gray-500 font-medium">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                  {preview.length > 5 && (
                    <tr><td colSpan={Object.keys(preview[0]).length} className="px-3 py-2 text-gray-400 text-center">...외 {preview.length - 5}명</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className={`rounded-xl p-4 ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.message}
            {result.success && (
              <Link href="/admin" className="block mt-2 text-sm underline">→ 어드민으로 돌아가기</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
