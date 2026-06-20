DROP POLICY IF EXISTS "Enable read access for authenticated kitchen staff to their branch" ON public.orders;

CREATE POLICY "Enable read access for authenticated kitchen staff to their branch" ON public.orders
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  (
    -- If user is admin, can read all
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    -- If user is kitchen, can only read their branch
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'kitchen' AND branch_id::text = (auth.jwt() -> 'user_metadata' ->> 'branch_id'))
  )
);
