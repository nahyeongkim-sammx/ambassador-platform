# 삼대오백 앰버서더 무상제품 신청 플랫폼

## 페이지 구성

| URL | 설명 |
|-----|------|
| `/` | 앰버서더 무상제품 신청 페이지 (공개) |
| `/admin` | 어드민 대시보드 (신청현황, 엑셀다운로드) |
| `/admin/products` | 제품 DB 관리 |
| `/admin/ambassadors-upload` | 앰버서더 명단 엑셀 업로드 |

## 설치 순서

### 1단계: Supabase 설정

1. https://supabase.com 에서 무료 계정 생성
2. New Project 클릭 → 프로젝트명 입력 (예: ambassador-platform)
3. 왼쪽 메뉴 → SQL Editor → New Query
4. `schema.sql` 파일 전체 내용 복사 → 붙여넣기 → Run
5. 왼쪽 메뉴 → Storage → New Bucket
   - 이름: `product-images`
   - Public bucket: ON (체크)
   - Save

### 2단계: 환경변수 확인

Supabase 대시보드 → Settings → API에서:
- `Project URL` → NEXT_PUBLIC_SUPABASE_URL
- `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

### 3단계: Vercel 배포

1. https://github.com 에서 무료 계정 생성
2. New Repository → 이름 입력 → Create
3. 이 폴더 전체를 GitHub에 업로드
4. https://vercel.com 에서 GitHub 연동
5. Import Repository → 프로젝트 선택
6. Environment Variables에 아래 3개 입력:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
7. Deploy 클릭

배포 완료 후 발급된 URL을 앰버서더에게 공유하세요!

## 매월 운영 방법

1. **어드민 접속**: `/admin` → 비밀번호 입력
2. **설정 탭**: 신청 월 + 마감일 변경
3. **제품 DB 탭**: 제품 추가/수정/삭제
4. **URL 발송**: 앰버서더에게 플랫폼 URL DM 발송
5. **엑셀 다운로드**: 마감 후 신청현황 탭에서 다운로드
