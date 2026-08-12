-- CytoGate Bilim Gazetesi — Supabase şeması
-- Bu dosyayı Supabase projesi oluşturulduktan sonra SQL Editor'da çalıştırın.

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  sort_order  int not null default 0
);

create table if not exists issues (
  id                uuid primary key default gen_random_uuid(),
  issue_number      int not null unique,
  title             text not null,
  description       text,
  cover_image_url   text,
  publish_date      date not null,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  created_at        timestamptz not null default now()
);

create table if not exists articles (
  id                uuid primary key default gen_random_uuid(),
  issue_id          uuid not null references issues(id) on delete cascade,
  category_id       uuid references categories(id) on delete set null,
  kicker            text,
  title             text not null,
  slug              text not null,
  summary           text,
  content           text not null,
  pull_quote        text,
  terms             jsonb,
  author_name       text,
  cover_image_url   text,
  is_featured       boolean not null default false,
  reading_minutes   int,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  published_at      timestamptz,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (issue_id, slug)
);

-- Kategori seti — Ali'nin paylaştığı gerçek Sayı 1 içeriğinden (GAZETE.pdf)
-- türetildi, kesinleşmiş sette artık ⚠️ yok.
insert into categories (slug, name, sort_order) values
  ('nobel-haberleri', 'Nobel Haberleri', 1),
  ('bilim-haberleri', 'Bilim Haberleri', 2),
  ('nadir-hastaliklar-kosesi', 'Nadir Hastalıklar Köşesi', 3),
  ('organizma-kosesi', 'Organizma Köşesi', 4),
  ('beyin-bilisim', 'Beyin & Bilişim', 5),
  ('roportajlar', 'Röportajlar', 6),
  ('tartisma-kosesi', 'Tartışma Köşesi', 7),
  ('takimlar', 'Takımlar', 8),
  ('etkinliklerimiz', 'Etkinliklerimiz', 9)
on conflict (slug) do nothing;

-- Row Level Security: herkes yayınlanmış içeriği okuyabilir, yazma işlemleri
-- yalnızca service-role key ile (RLS'i bypass eder) yapılır.
alter table categories enable row level security;
alter table issues enable row level security;
alter table articles enable row level security;

create policy "categories are publicly readable" on categories
  for select using (true);

create policy "published issues are publicly readable" on issues
  for select using (status = 'published');

create policy "published articles are publicly readable" on articles
  for select using (status = 'published');

-- Storage: "gazete-medya" bucket'ını Supabase Dashboard > Storage üzerinden
-- PUBLIC olarak oluşturun (kod ile otomatik oluşturulmuyor).
