-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- SCHOOLS
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USERS (Extends auth.users, but for this MVP we might sync or just trust the app to manage it in public.users linked to auth)
-- We'll assume a public.users table that is 1:1 with auth.users for profile data.
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('owner', 'admin', 'teacher', 'student')),
  school_id uuid references schools(id),
  avatar_url text,
  must_change_password boolean default false,
  
  -- Teacher specific
  specialization text,
  
  -- Student specific
  student_no text,
  class_id uuid, -- validation delayed as classes table defined later
  parent_email text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CLASSES
create table classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  name text not null, -- e.g. "6"
  section text not null, -- e.g. "A"
  grade int not null,
  education_level text not null check (education_level in ('Primary', 'Secondary', 'High School')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add fk for students to classes
alter table users add constraint fk_users_class foreign key (class_id) references classes(id);

-- SUBJECTS
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  name text not null,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TEACHER SUBJECTS (Junction)
create table teacher_subjects (
  teacher_id uuid references users(id) not null,
  subject_id uuid references subjects(id) not null,
  primary key (teacher_id, subject_id)
);

-- EXAMS
create table exams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  title text not null,
  lesson_id uuid references subjects(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RESULTS (GRADES)
create table results (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  exam_id uuid references exams(id), -- Nullable for ad-hoc? usually not.
  student_id uuid references users(id) not null,
  class_id uuid references classes(id) not null,
  subject_id uuid references subjects(id) not null,
  teacher_id uuid references users(id) not null,
  score int not null check (score >= 0 and score <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ATTENDANCE
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  student_id uuid references users(id) not null,
  class_id uuid references classes(id) not null,
  date date not null,
  period_number int not null,
  status text not null check (status in ('Present', 'Absent', 'Late', 'Excused')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, date, period_number)
);

-- TIMETABLE
create table timetable (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  class_id uuid references classes(id) not null,
  teacher_id uuid references users(id) not null,
  subject_id uuid references subjects(id) not null,
  day_of_week text not null check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  period_number int not null,
  unique(school_id, class_id, day_of_week, period_number), -- One class, one slot
  unique(school_id, teacher_id, day_of_week, period_number) -- One teacher, one slot
);

-- RLS POLICIES (Simplified for Initial Setup)
alter table schools enable row level security;
alter table users enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table exams enable row level security;
alter table results enable row level security;
alter table attendance enable row level security;
alter table timetable enable row level security;

-- Allow read access to authenticated users for now (to be refined)
create policy "Allow read access for authenticated users" on schools for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on users for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on classes for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on subjects for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on exams for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on results for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on attendance for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on timetable for select using (auth.role() = 'authenticated');

-- Allow managers (admins) and teachers to insert/update data
create policy "Allow insert for authenticated users" on classes for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated users" on classes for update using (auth.role() = 'authenticated');
create policy "Allow delete for authenticated users" on classes for delete using (auth.role() = 'authenticated');

create policy "Allow insert for authenticated users" on subjects for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated users" on subjects for update using (auth.role() = 'authenticated');
create policy "Allow delete for authenticated users" on subjects for delete using (auth.role() = 'authenticated');

create policy "Allow insert for authenticated users" on exams for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated users" on exams for update using (auth.role() = 'authenticated');
create policy "Allow delete for authenticated users" on exams for delete using (auth.role() = 'authenticated');

create policy "Allow insert for authenticated users" on results for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated users" on results for update using (auth.role() = 'authenticated');
create policy "Allow delete for authenticated users" on results for delete using (auth.role() = 'authenticated');

create policy "Allow insert for authenticated users" on attendance for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated users" on attendance for update using (auth.role() = 'authenticated');
create policy "Allow delete for authenticated users" on attendance for delete using (auth.role() = 'authenticated');

create policy "Allow insert for authenticated users" on timetable for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated users" on timetable for update using (auth.role() = 'authenticated');
create policy "Allow delete for authenticated users" on timetable for delete using (auth.role() = 'authenticated');

-- FUNCTIONS TO HANDLE USER CREATION (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, first_name, last_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
