-- 1. Garante que o bucket 'hangout-bucket' seja público (se já não estiver)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hangout-bucket', 'hangout-bucket', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Remove políticas existentes para evitar duplicidade
DROP POLICY IF EXISTS "Permitir upload para hangout-bucket" ON storage.objects;
DROP POLICY IF EXISTS "Permitir visualização pública de hangout-bucket" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update em hangout-bucket" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete em hangout-bucket" ON storage.objects;

-- 3. Permite inserção/upload de arquivos no bucket 'hangout-bucket'
CREATE POLICY "Permitir upload para hangout-bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'hangout-bucket');

-- 4. Permite leitura/download público dos arquivos do bucket 'hangout-bucket'
CREATE POLICY "Permitir visualização pública de hangout-bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hangout-bucket');

-- 5. Permite atualização de arquivos no bucket 'hangout-bucket'
CREATE POLICY "Permitir update em hangout-bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'hangout-bucket');

-- 6. Permite exclusão de arquivos no bucket 'hangout-bucket'
CREATE POLICY "Permitir delete em hangout-bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'hangout-bucket');
