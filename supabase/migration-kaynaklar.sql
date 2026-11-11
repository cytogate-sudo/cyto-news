-- Makale sonundaki kaynakça için ek sütun.
-- Supabase Dashboard > SQL Editor'da bu dosyanın tamamını çalıştırın.
--
-- Biçim: [{ "label": "Kaynağın adı", "url": "https://..." veya null }, ...]
-- Kaynağı olmayan makalelerde null kalır, sitede hiçbir şey görünmez.

alter table articles
  add column if not exists sources jsonb;
