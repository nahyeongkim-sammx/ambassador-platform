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
  const [fileName, setFileName] = useState('')
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setResult(null)
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

    const rows = preview.map(row => ({
      real_name: row['본명'] || row['이름'] || '',
      phone: String(row['연락처'] || row['전화번호'] || ''),
      zipcode: String(row['우편번호'] || ''),
      address: row['주소'] || '',
      instagram: row['인스타그램'] || row['instagram'] || '',
    })).filter(r => r.real_name)

    const { error } = await supabase
      .from('ambassadors')
      .upsert(rows, { onConflict: 'real_name' })

    setUploading(false)
    if (error) {
      setResult({ success: false, message: '업로드 실패: ' + error.message })
    } else {
      await supabase.from('settings').upsert({ key: 'last_ambassador_upload', value: new Date().toISOString() })
      setResult({ success: true, count: rows.length })
    }
  }

  function downloadTemplate() {
    const template = [{ '본명': '홍길동', '연락처': '01012345678', '우편번호': '06000', '주소': '서울시 강남구 테헤란로 123', '인스타그램': 'honggildong' }]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '앰버서더')
    XLSX.writeFile(wb, '앰버서더_업로드_템플릿.xlsx')
  }

  function resetAll() {
    setPreview([])
    setFileName('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">로딩 중...</p>
    </div>
  )
  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>앰버서더 업로드 | 삼대오백 앰버서더 허브</title></Head>

      <header className="bg-white border-b px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-orange-500 font-bold text-lg">삼대오백 앰버서더 허브</Link>
          <span className="text-gray-200">|</span>
          <span className="text-gray-500 text-sm">앰버서더 명단 업로드</span>
        </div>
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 대시보드로
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">앰버서더 명단 업로드</h1>
          <p className="text-gray-500">기존 엑셀/구글시트 데이터를 그대로 올리시면 됩니다.<br/>본명 기준으로 자동 매핑되며, 기존 데이터는 덮어쓰기됩니다.</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">엑셀 컬럼 형식 안내</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { col: '본명', req: true, ex: '홍길동' },
              { col: '연락처', req: true, ex: '01012345678' },
              { col: '우편번호', req: true, ex: '06000' },
              { col: '주소', req: true, ex: '서울시 강남구 테헤란로 123' },
              { col: '인스타그램', req: false, ex: 'honggil' },
            ].map(({ col, req, ex }) => (
              <div key={col} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm font-medium text-gray-800">{col}</span>
                  {req && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold">필수</span>}
                </div>
                <p className="text-xs text-gray-400">{ex}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              템플릿 다운로드
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">파일 선택</p>
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${fileName ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            {fileName ? (
              <>
                <div className="text-4xl mb-3">📊</div>
                <p className="font-semibold text-orange-600 text-base mb-1">{fileName}</p>
                <p className="text-gray-400 text-sm">{preview.length}명 데이터 인식됨 · 클릭하면 파일 변경</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">📂</div>
                <p className="font-semibold text-gray-600 text-base mb-1">여기에 파일을 드래그하거나 클릭해서 선택</p>
                <p className="text-gray-400 text-sm">.xlsx / .xls / .csv 지원</p>
              </>
            )}
          </div>
        </div>

        {preview.length > 0 && (
          <div className="bg-white rounded-2xl border p-6 mb-5">
            <div className="mb-4">
              <p className="font-semibold text-gray-900">데이터 미리보기</p>
              <p className="text-gray-400 text-xs mt-0.5">상위 5명만 표시 · 전체 {preview.length}명 업로드 예정</p>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {Object.keys(preview[0]).map(k => (
                      <th key={k} className="px-4 py-3 text-left text-gray-500 font-medium text-xs">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-4 py-3 text-gray-700 text-xs">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                  {preview.length > 5 && (
                    <tr>
                      <td colSpan={Object.keys(preview[0]).length} className="px-4 py-3 text-center text-gray-400 text-xs">
                        ...외 {preview.length - 5}명
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className={`rounded-2xl p-6 mb-5 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success ? (
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-green-700 text-lg mb-1">{result.count}명 업로드 완료!</p>
                <p className="text-green-600 text-sm mb-4">중복 본명은 최신 데이터로 덮어쓰기 되었습니다.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/admin" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                    대시보드로 이동
                  </Link>
                  <button onClick={resetAll} className="bg-white border border-green-300 text-green-600 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors">
                    다시 업로드
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-red-600 font-medium">{result.message}</p>
            )}
          </div>
        )}

        {preview.length > 0 && !result?.success && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors"
          >
            {uploading ? '업로드 중...' : `${preview.length}명 업로드 실행`}
          </button>
        )}
      </div>
    </div>
  )
}
