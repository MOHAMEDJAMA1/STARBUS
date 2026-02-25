-- Sync script: Finds all users in auth.users who do not have a public.profile and creates it.

do $$
declare
  r record;
begin
  for r in 
    select 
      au.id, 
      au.email, 
      au.raw_user_meta_data,
      au.created_at
    from auth.users au
    left join public.profiles pp on au.id = pp.id
    where pp.id is null
  loop
    
    begin
      insert into public.profiles (id, email, full_name, role, branch_id)
      values (
        r.id, 
        r.email, 
        r.raw_user_meta_data->>'full_name', 
        coalesce(r.raw_user_meta_data->>'role', 'branch_worker'),
        (r.raw_user_meta_data->>'branch_id')::uuid
      );
      raise notice 'Fixed profile for: %', r.email;
    exception when others then
      raise warning 'Failed to fix profile for %: %', r.email, SQLERRM;
    end;
    
  end loop;
end $$;
