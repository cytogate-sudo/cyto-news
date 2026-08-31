-- Admin paneli için ek şema (mevcut schema.sql'in ÜZERİNE çalıştırılır).
-- Supabase Dashboard > SQL Editor'da bu dosyanın tamamını çalıştırın.

-- 1) Admin kullanıcıları (kullanıcı adı + scrypt şifre özeti)
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
-- Kasıtlı olarak hiçbir public policy yok: bu tabloya yalnızca
-- service-role key ile (sunucu tarafından) erişilir.

-- Başlangıç admin kullanıcısı (şifre panelden değiştirilebilir)
insert into admin_users (username, password_hash)
values (
  'cytogate',
  'scrypt:b7399e8a538182013df094006a0b0318:7a54322d3d9d5a53636e5320849291803b5612fc1ebafe04ba3e2a8fd81e2a3a0d9463c5b34d7e964863813d1363eb4a986e0913a753fc125602ce669e5559cd'
)
on conflict (username) do nothing;

-- 2) Site ayarları (tema renkleri, masthead metinleri vb.)
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;
-- Yine yalnızca service-role erişimi.

-- 3) Makale/sayı kapak görseli düzeni için yeni sütunlar
alter table articles
  add column if not exists cover_position text not null default 'center',
  add column if not exists cover_aspect text not null default 'wide';

alter table issues
  add column if not exists cover_position text not null default 'center';
