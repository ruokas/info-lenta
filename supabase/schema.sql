-- Create the patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  bed TEXT,
  symptoms TEXT,
  comment TEXT,
  emergency_category TEXT,
  vitals JSONB,
  arrival_time TIMESTAMP WITH TIME ZONE,
  drug_prescriptions JSONB,
  tasks JSONB
);

-- Create the drugs table
CREATE TABLE drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  dose TEXT,
  administration_way TEXT,
  storage_amount INTEGER,
  additional_info TEXT
);

-- Create the tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id),
  assignee_id UUID REFERENCES personnel(id),
  status TEXT
);

-- Create the personnel table
CREATE TABLE personnel (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone_number TEXT,
  speciality TEXT,
  skills JSONB,
  vacation_info JSONB
);

-- Create the roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Create the user_roles table
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES personnel(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

-- Create the shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  personnel_id UUID REFERENCES personnel(id)
);
