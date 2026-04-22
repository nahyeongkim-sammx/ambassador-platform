import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // URL 해시에서 Supabase 세션 토큰 처리
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  async function handleReset() {
    setError('')
    if (!password) { setError('새 비밀번호를 입력해주세요.'); return }
    if (password.length < 6) { setError('비밀번호는 6자리 이상이어야 해요.'); return }
    if (password !== confirm) { setError('비밀번호가 일치하지 않아요.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('변경 실패: ' + error.message)
      setLoading(false)
      return
    }

    alert('비밀번호가 변경되었습니다!')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Head><title>비밀번호 재설정 | 삼대오백</title></Head>

      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <div className="mb-6">
          <span className="inline-block bg-orange-50 text-orange-500 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3">Admin</span>
          <h1 className="text-xl font-bold text-gray-900">비밀번호 재설정</h1>
          <p className="text-gray-400 text-sm mt-1">새로운 비밀번호를 입력해주세요.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">새 비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="6자리 이상"
              className="w-full border rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">비밀번호 확인</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              placeholder="다시 입력"
              className="w-full border rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-1"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </div>
    </div>
  )
}
