-- ================================================
-- 삼대오백 앰버서더 무상제품 플랫폼 - DB 스키마
-- Supabase SQL Editor에 복사해서 실행하세요
-- ================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 제품 테이블
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT,
  category1 TEXT NOT NULL,
  category2 TEXT DEFAULT '',
  category3 TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 앰버서더 테이블 (배송정보 포함)
CREATE TABLE IF NOT EXISTS ambassadors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  real_name TEXT NOT NULL UNIQUE,
  instagram TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  zipcode TEXT DEFAULT '',
  address TEXT DEFAULT '',
  address_detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 월별 신청 내역 테이블
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL,
  real_name TEXT NOT NULL,
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE SET NULL,
  product1_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product2_id UUID REFERENCES products(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, real_name)
);

-- 4. 설정 테이블 (마감일, 현재 월)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 설정값 삽입
INSERT INTO settings (key, value) VALUES ('deadline', '2099-12-31') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('current_month', TO_CHAR(NOW(), 'YYYY-MM')) ON CONFLICT (key) DO NOTHING;

-- ================================================
-- Row Level Security (RLS) 설정
-- ================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 읽을 수 있음 (제품, 설정)
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "ambassadors_public_read" ON ambassadors FOR SELECT USING (true);

-- 신청은 누구나 삽입 가능 (중복 방지는 UNIQUE 제약으로)
CREATE POLICY "applications_insert" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "applications_select" ON applications FOR SELECT USING (true);

-- 어드민만 수정/삭제 (service_role key 사용 시 우회됨)
CREATE POLICY "products_admin_all" ON products FOR ALL USING (true);
CREATE POLICY "ambassadors_admin_all" ON ambassadors FOR ALL USING (true);
CREATE POLICY "settings_admin_all" ON settings FOR ALL USING (true);
CREATE POLICY "applications_admin_delete" ON applications FOR DELETE USING (true);

-- ================================================
-- Storage 버킷 생성 (이미지용)
-- ================================================
-- Supabase 대시보드 > Storage > 새 버킷 생성:
-- 버킷 이름: product-images
-- Public: ON (체크)
-- 아래 SQL은 참고용입니다.

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT DO NOTHING;

-- ================================================
-- 샘플 데이터 (테스트용, 필요 시 삭제)
-- ================================================

-- 제품 데이터 INSERT (110개)
-- Supabase SQL Editor에서 schema.sql 실행 후 이 SQL을 따로 실행하세요

INSERT INTO products (name, sku, category1, category2, category3, image_url, is_active) VALUES
  ('WPI 웨이 프로틴 오리지널 초코 1kg', '삼대오백WPI포대1kg초코', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/96ff1bdce47bfe3fd75416d948d76de3.jpg', true),
  ('WPI 웨이 프로틴 오리지널 바나나 1kg', '삼대오백WPI포대1kg바나나', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/c9ff4218ebfbf7ae3e97830c6df70683.jpg', true),
  ('WPI 웨이 프로틴 오리지널 쿠앤크 1kg', '삼대오백WPI포대1kg쿠앤크', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/e81638ae7470eb8849b24f9275b58a52.jpg', true),
  ('WPI 웨이 프로틴 오리지널 슈크림라떼 1kg', '삼대오백WPI포대1kg슈크림', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202511/d5ae9a6e572b4aea6a085805aa0f8ccc.jpg', true),
  ('WPI 웨이 프로틴 오리지널 생크림카스테라 1kg', '삼대오백WPI포대1kg카스테라', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202511/b6562279b1f713c5f83add847ea4324e.jpg', true),
  ('WPI 웨이 프로틴 뉴클래식 딸기라떼 1kg', '삼대오백WPI포대1kg딸기라떼', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202603/f42d2855019963183210f8ac3f0b0107.jpg', true),
  ('WPI 웨이 프로틴 뉴클래식 딸기초코생크림 1kg', '삼대오백WPI포대1kg딸초생', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202511/224057d6610381477d593d08ff26c774.jpg', true),
  ('WPI 웨이 프로틴 오리지널 피스타치오 초코 1kg', '삼대오백WPI포대1kg피스타치오초코', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/1a45b7c99a27a3bc19c9cce2adec1ff9.jpg', true),
  ('WPI 웨이 프로틴 뉴클래식 콘스위트포테이토 1kg', '삼대오백WPI포대1kg콘스포', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202511/82321ba0153be39fa3dc45ba38caa295.jpg', true),
  ('WPI 웨이 프로틴 뉴클래식 밀크캬라멜 1kg', '삼대오백WPI포대1kg캬라멜', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202511/85b98463f56ced5564e1c60a09dc9187.jpg', true),
  ('WPI 웨이 프로틴 퓨어 800g', '삼대오백퓨어WPI포대800g', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202603/7a027f9884911575e697c2ac5d7f355c.jpg', true),
  ('WPI 웨이 프로틴 오리지널 초코 2kg', '삼대오백WPI통2kg초코', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/small/202510/1b080ac2730777bb129423a8d9b81fad.jpg', true),
  ('WPC 웨이 프로틴 초코 2kg', '삼대오백WPC통2kg초코', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/small/202412/7d6e9510c37d52482ef9041c67836d79.jpg', true),
  ('WPC 웨이 프로틴 초콜릿 1kg', '삼대오백WPC포대1kg초코', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/fcbdbedfa9f656127cef70636b83695a.jpg', true),
  ('WPC 웨이 프로틴 쿠앤크 1kg', '삼대오백WPC포대1kg쿠앤크', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/b009561c95efc29c6b8ebb5802019cba.jpg', true),
  ('WPC 웨이 프로틴 바나나 1kg', '삼대오백WPC포대1kg바나나', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/0083f5c410428cab45f128ff4cc420c7.jpg', true),
  ('WPC 웨이 프로틴 피스타치오초코 1kg', '삼대오백WPC포대1kg피스타치오초코', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202501/94817b8b3f7a88a42c352b7d14255d95.jpg', true),
  ('퓨어 카보린(시즌용) 체리레몬', '삼대오백카보린인시즌체리레몬', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202410/f9a2913eaf9eb6d0b2babacd007e4c14.jpg', true),
  ('퓨어 카보린(시즌용) 플레인', '삼대오백카보린인시즌플레인', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202410/40ab61bb74d394e88c19670384948a03.jpg', true),
  ('퓨어 카보린(오프시즌) 고구마', '삼대오백카보린오프시즌고구마', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202510/b0a8ecde22553e38a3c11320e2cfdb58.jpg', true),
  ('퓨어 카보린(오프시즌) 곡물', '삼대오백카보린오프시즌곡물', '프로틴/탄수화물', '', '', 'https://samdae500.com/web/product/extra/small/202510/9223b836820330b04aed4c6f139b0e04.jpg', true),
  ('크레아틴 모노 하이드레이트 300g', '삼대오백크레아틴', '크레아틴', '', '', 'https://samdae500.com/web/product/small/202511/3a42e3bd1b3e81b13a2a00f58aa0d432.jpg', true),
  ('크레아틴 모노 하이드레이트 정제 120정', '"', '크레아틴', '', '', '삼대오백크레아틴120정"', true),
  ('크레아퓨어 크레아틴 300g', '삼대오백크레아퓨어크레아틴', '크레아틴', '', '', 'https://samdae500.com/web/product/small/202511/e67f0ff1c53524b025d8d1af6d97c9ae.jpg', true),
  ('크레아퓨어 크레아틴 정제 120정', '삼대오백크레아퓨어크레아틴120정', '크레아틴', '', '', 'https://samdae500.com/web/product/small/202511/bd1107b1a040fe3b46ebb4bc949f06c0.jpg', true),
  ('크레아퓨어 크레아틴 츄어블 레몬맛 90정', '삼대오백크레아퓨어크레아틴츄어블90정레몬', '크레아틴', '', '', 'https://samdae500.com/web/product/extra/small/202603/9c8d37f40348cfb8588d9e790c25c4ad.jpg', true),
  ('EAA 오리지널 요구르트 300g', '삼대오백EAA오리지널300요구르트', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202412/0b11f5b82412167cc721d84a3ab947ff.jpg', true),
  ('EAA 오리지널 매실 300g', '삼대오백EAA오리지널300매실', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202412/82f218b11b8662c7358bee92f39a4ca0.jpg', true),
  ('EAA 오리지널 크림소다 300g', '삼대오백EAA오리지널300크림소다', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202412/fde74d4d1fce669c21059375ca22a26d.jpg', true),
  ('EAA 오리지널 블루베리 300g', '삼대오백EAA오리지널300블루베리', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202604/c73a2ac7bc9e7ba0c953aca25818eebf.jpg', true),
  ('EAA 오리지널 체리 300g', '삼대오백EAA오리지널300체리', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202604/447bc21d55a76c3ddb60e74b1716a42d.jpg', true),
  ('EAA 오리지널 알로에 300g', '삼대오백EAA오리지널300알로에', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202604/982d24386c886eef8c88a861c0ae6168.jpg', true),
  ('EAA 오리지널 요구르트 700g', '삼대오백EAA오리지널700요구르트', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202507/75782f3da661cd0f37302e10949b9af3.png', true),
  ('EAA 오리지널 매실 700g', '삼대오백EAA오리지널700매실', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202507/74bb129850e7de5c4d06f3f514f18b37.png', true),
  ('EAA 오리지널 크림소다 700g', '삼대오백EAA오리지널700크림소다', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202507/3d223f3d61694a1cb9cd50d0b3a2f9b8.png', true),
  ('EAA 오리지널 블루베리 700g', '삼대오백EAA오리지널700블루베리', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202604/917ace431fffad797950a53dcd2ac4aa.jpg', true),
  ('EAA 오리지널 체리 700g', '삼대오백EAA오리지널700체리', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202604/f51db4c60498db63ad3c7bd3fa03a78f.jpg', true),
  ('EAA 오리지널 알로에 700g', '삼대오백EAA오리지널700알로에', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202604/3858f69f43dceb5be54127f6b477bfd3.jpg', true),
  ('BCAA 오리지널 망고', '삼대오백BCAA오리지널300망고', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202509/c305784c4fd06867cdb83a470bc2cff8.jpg', true),
  ('BCAA 오리지널 레몬', '삼대오백BCAA오리지널300레몬', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202509/46d1c634edac5b627bbeff41713fe20d.jpg', true),
  ('BCAA 오리지널 파인애플', '삼대오백BCAA오리지널300파인애플', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202509/9e495c96885ec0ec09c52e50d52fb812.jpg', true),
  ('BCAA 오리지널 사과', '삼대오백BCAA오리지널300사과', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202509/72d3c257011c02f299c06f2f3fbd165c.jpg', true),
  ('BCAA PRO 핑크피치', '삼대오백BCAA프로핑크피치', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202310/19bff36831b214c35375098baa940ce9.jpg', true),
  ('BCAA PRO 블루머슬에이드', '삼대오백BCAA프로블루머슬에이드', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202310/43430e0ea513f3df5d30db9c51613550.jpg', true),
  ('BCAA PRO 스위트워터멜론', '삼대오백BCAA프로스위트워터멜론', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202310/79047c01f404fb2447b5cb222bcb1645.jpg', true),
  ('BCAA PRO 퍼플그레이프', '삼대오백BCAA프로퍼플그레이프', 'EAA/BCAA', '', '', 'https://samdae500.com/web/product/extra/small/202310/785f2a494931f13a733ae60b269b52dd.jpg', true),
  ('프리워크아웃 오리지널', '삼대오백부스터오리지널', '부스터', '', '', 'https://samdae500.com/web/product/small/202404/542e450bae32327a43557a0ab58a1ff3.jpg', true),
  ('프리워크아웃 프로', '삼대오백부스터프로', '부스터', '', '', 'https://samdae500.com/web/product/small/202404/b32604620a83d36588ae832a78878a9d.jpg', true),
  ('월드클래스 분말 300g 오렌지', '삼대오백부스터월클300오렌지', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202406/c4f824486645df6765ea44435ed566cd.jpg', true),
  ('월드클래스 분말 300g 레몬', '삼대오백부스터월클300레몬', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202406/c9311cbe0678d387997ce943eb0d1015.jpg', true),
  ('월드클래스 분말 300g 포도', '삼대오백부스터월클300포도', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202406/baa43f95c59baa2af88772b2694aa7d1.jpg', true),
  ('월드클래스 분말 300g 포도', '삼대오백부스터월클300망고', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202406/870861b02b7a51d222c804b4ac5bae45.jpg', true),
  ('월드클래스 분말 700g 오렌지', '삼대오백부스터월클700오렌지', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202407/58b86d767845439e25fcf512cef140b6.jpg', true),
  ('월드클래스 분말 700g 레몬', '삼대오백부스터월클700레몬', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202407/6a58bb47d4e7a59eb0ebf197f98968b6.jpg', true),
  ('월드클래스 분말 700g 포도', '삼대오백부스터월클700포도', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202407/d3341b8d55ab0de0aff11d1e27f96015.jpg', true),
  ('월드클래스 분말 700g 망고', '삼대오백부스터월클700망고', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202407/7639a71c39a02bdbd626f92c344aab30.jpg', true),
  ('월드클래스 펌프', '삼대오백월클펌프', '부스터', '', '', 'https://samdae500.com/web/product/small/202601/af0ec55d1567ba23e064c05464985032.jpg', true),
  ('글리펌프 파인애플', '삼대오백글리펌프파인애플', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202601/4eb8ca16945efd87705d4404773ba4e8.jpg', true),
  ('글리펌프 워터멜론', '삼대오백글리펌프워터멜론', '부스터', '', '', 'https://samdae500.com/web/product/small/202601/319b7258d1dce533d8dbc04932cea18b.jpg', true),
  ('글리펌프 초코바나나', '삼대오백글리펌프초코바나나', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202601/70c3b90715fffec8aa03cab3ec264401.jpg', true),
  ('바이퍼 에너지 그린 24캔', '삼대오백바이퍼에너지그린트레이(24C)', '부스터', '', '', 'https://samdae500.com/web/product/small/202505/d759082022d26bf611db70740b3a10bd.jpg', true),
  ('글루타민 300g', '삼대오백글루타민300플레인', '부스터', '', '', 'https://samdae500.com/web/product/small/202411/02a6a7f8b0e74d869ffc300f092088a5.jpg', true),
  ('글루타민 700g 대용량', '삼대오백글루타민700플레인', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202507/e939f201eafe0e8eb7c8eb5e581bf103.jpg', true),
  ('아르기닌 6300', '삼대오백아르기닌', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202406/a93c6f9e485fb0e07757e07f1df8eda7.jpg', true),
  ('비트루트 액상스틱', '삼대오백비트루트액상스틱', '부스터', '', '', 'https://samdae500.com/web/product/small/202603/79a25b16e5fca9a647b25f43bd52d044.jpg', true),
  ('히말라야 핑크솔트', '삼대오백핑크솔트30개입', '부스터', '', '', 'https://samdae500.com/web/product/extra/small/202401/81599cbc1623643fed0fbcda3a444270.jpg', true),
  ('과라나추출물 천연 카페인', '삼대오백과라나카페인', '부스터', '', '', 'https://samdae500.com/web/product/small/202410/8560a1fe4b222043c08f47b56fc9dc63.jpg', true),
  ('ALLRIGHT REBOOT', '삼대오백올라잇리부트복숭아', '부스터', '', '', 'https://samdae500.com/web/product/small/202502/1ed185ee2a631469ab4b542ec5b2d736.jpg', true),
  ('ALLRIGHT DEEP', '삼대오백올라잇딥레몬', '부스터', '', '', 'https://samdae500.com/web/product/small/202502/d85ef4383d4bc0de44b57745c0767b4a.jpg', true),
  ('올인원 멀티비타민 100정', '삼대오백멀티비타민100정', '영양제', '', '', 'https://samdae500.com/web/product/small/202601/de4523b2a04607cd3b119aa3fe3ceda5.jpg', true),
  ('올인원 멀티비타민', '삼대오백멀티비타민', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/3159688be6aeb83ba47abfaeb1fc8df0.jpg', true),
  ('비타민C', '삼대오백비타민C30정', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/272db4d016130775dab40e9468641add.jpg', true),
  ('비타민D 4000IU', '삼대오백비타민D30캡슐', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/2627c11ade0d6275a2cbc118f58035e1.jpg', true),
  ('쏘팔메토 로르산 옥타코사놀', '삼대오백쏘팔메토30캡슐', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/23225c3cee8d0d74a9ccc89dbec07eab.jpg', true),
  ('블랙마카 120정', '삼대오백블랙마카120정', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/45024a91303331baccd3c369e28ffd6f.jpg', true),
  ('블랙마카 액상스틱 2200', '삼대오백블랙마카스틱', '영양제', '', '', 'https://samdae500.com/web/product/extra/small/202404/fe8e53233d9cf8db4e67053331b0fdf3.jpg', true),
  ('마그네슘', '삼대오백마그네슘', '영양제', '', '', 'https://samdae500.com/web/product/extra/small/202410/892a17aaa33c562a59e18a71d66b821c.jpg', true),
  ('프로바이오틱스 20억 유산균', '삼대오백유산균20억30캡슐', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/10627471cd99fbf15cd2c98dec683125.jpg', true),
  ('홍경천추출물', '삼대오백홍경천30정', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/ff6d1c73d7c3702f5cb5782703b6890a.jpg', true),
  ('밀크씨슬 30캡슐', '삼대오백밀크씨슬', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/771f4468d86a1bf8f5c41775b218f3a3.jpg', true),
  ('밀크씨슬 100캡슐', '삼대오백밀크씨슬100캡슐', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/d8acb4fa098c2473f086c9e1b5e93335.jpg', true),
  ('알티지 오메가3 600', '삼대오백오메가600', '영양제', '', '', 'https://samdae500.com/web/product/small/202412/663493f4e1c7f5e3386572b8e2c94ab0.jpg', true),
  ('알티지 오메가3 900', '삼대오백오메가900mg100캡슐', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/dcb31dcd4150163a70bdeb9ad0bac8c7.jpg', true),
  ('아연&항산화 프로폴리스', '삼대오백프로폴리스', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/dbca772b16af23c2895125265ff78bba.jpg', true),
  ('혈당조절 바나바잎 추출물', '삼대오백바나바정제', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/4e0d443b1ffcdca5f344f3276a0d9fd7.jpg', true),
  ('관절 영양 MSM', '삼대오백MSM', '영양제', '', '', 'https://samdae500.com/web/product/small/202412/9db017fb81a102369720678bafe7c9da.jpg', true),
  ('고함량 20mg 홍삼정 진액스틱', '뉴트리커먼홍삼정스틱', '영양제', '', '', 'https://samdae500.com/web/product/small/202205/81cbb8b8284737a453dcac5106085863.jpg', true),
  ('리바이탈엑스', '삼대오백리바이탈엑스', '영양제', '', '', 'https://samdae500.com/web/product/small/202511/989ffce38f4f5dcbc35aacdef7f355f7.jpg', true),
  ('루테인지아잔틴아스타잔틴 맥스', '삼대오백루지잔틴맥스', '영양제', '', '', 'https://samdae500.com/web/product/small/202511/a167fef69fc757a15f5c8da3da8a987f.jpg', true),
  ('해조칼슘 30정', '삼대오백해조칼슘30정', '영양제', '', '', 'https://samdae500.com/web/product/small/202407/19c06f30b5a5cc99b456f03d4ee72ef1.jpg', true),
  ('타트체리 30정', '삼대오백타트체리30정', '영양제', '', '', 'https://samdae500.com/web/product/small/202410/0005437471060b07be69d98f1c2f955b.jpg', true),
  ('실온보관 닭가슴살 ORIGIANAL', '삼대오백실온닭가슴살100g팩오리지널', '식품', '', '', 'https://samdae500.com/web/product/small/202601/60c293dd555dcbb07c8bba6006ceed9f.jpg', true),
  ('통 흑마늘 500g', '삼대오백통흑마늘500', '식품', '', '', 'https://samdae500.com/web/product/extra/small/202402/ce33a97e2a8b43fd19bc62cc4fb34f8b.jpg', true),
  ('유기농 레몬 착즙 원액 100%', '삼대오백레몬착즙스틱', '식품', '', '', 'https://samdae500.com/web/product/extra/small/202511/645dcaf083ee384f753e9ef771dc010e.jpg', true),
  ('프리미엄 쉐이커 600ml 블랙', '삼대오백텀블러600-블랙', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202604/50fdb2ffb8345c783ad49b24db1aed2e.jpg', true),
  ('프리미엄 쉐이커 600ml 화이트', '삼대오백텀블러600-화이트', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202604/2233acfa3ab66f0dc920485199df4529.jpg', true),
  ('프리미엄 쉐이커 800ml 블랙', '삼대오백쉐이커800-블랙', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202603/4006eec9d8844096ecf32ee68434a303.jpg', true),
  ('프리미엄 쉐이커 800ml 화이트', '삼대오백쉐이커800-화이트', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202603/9718730c1cafabb2962c11479ec321f4.jpg', true),
  ('프리미엄 쉐이커 800ml 블루', '삼대오백쉐이커800-블루', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202603/e90ea839dd7b2da545b604bf65e33f8e.jpg', true),
  ('프리미엄 쉐이커 800ml 핑크', '삼대오백쉐이커800-핑크', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202603/5118f1809fe4b83aa975aa69e38b2b21.jpg', true),
  ('프리미엄 쉐이커 800ml 옐로우', '삼대오백쉐이커800-옐로우', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202603/70ce08a2356f1f74220c7ce72bc0ab2f.jpg', true),
  ('프리미엄 쉐이커 1.2L 블랙', '삼대오백쉐이커1.2L-블랙', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202508/aa49bb12ee1074dd90b980dd1c7dd1a7.jpg', true),
  ('프리미엄 쉐이커 1.2L 화이트', '삼대오백쉐이커1.2L-화이트', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202508/5c6afd6563ab9e369691df3a5b2c70a9.jpg', true),
  ('프리미엄 쉐이커 1.2L 블루', '삼대오백쉐이커1.2L-블루', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202508/be200ba2cf6644944655bbd0345c2beb.jpg', true),
  ('에센셜 프리미엄 트라이탄 쉐이커 600ml 에메랄드 그린', '삼대오백트라이탄쉐이커600ml-그린', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202601/e9707b7dc7eabdfb1531a6c292353ac1.jpg', true),
  ('에센셜 프리미엄 트라이탄 쉐이커 600ml 클리어 블랙', '삼대오백트라이탄쉐이커600ml-블랙', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202601/a8923d23b53509dd3490a5982d940eaf.jpg', true),
  ('에센셜 프리미엄 트라이탄 쉐이커 600ml 클리어 화이트', '삼대오백트라이탄쉐이커600ml-투명', '용품', '', '', 'https://samdae500.com/web/product/extra/small/202601/ed442bbf2a60a9e167112d1ac88e1c68.jpg', true),
  ('마그네슘 리커버리 핫크림 프로', '삼대오백Mg핫크림프로', '용품', '', '', 'https://samdae500.com/web/product/small/202511/288e3a843f08e7255c0437475a7ae825.jpg', true),
  ('마크네슘 리커버리 핫크림 오리지널', '삼대오백Mg핫크림오리지널', '용품', '', '', 'https://samdae500.com/web/product/small/202511/cf8500f5214cb766e71b0d1d9b6e3ccc.jpg', true),
  ('아브어루내 맥주효모 탈모완화 샴푸', '뉴트리커먼아브아탈모샴푸', '용품', '', '', 'https://samdae500.com/web/product/small/202508/8caf49e36963114739ddab84f5daede6.jpg', true)
ON CONFLICT DO NOTHING;
