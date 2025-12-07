-- Enable Row Level Security for all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Helper function to get a user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = $1
  LIMIT 1;
  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for the 'patients' table
CREATE POLICY "Allow read access to all authenticated users" ON patients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow doctors and nurses to create patients" ON patients FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('Doctor', 'Nurse', 'Charge Nurse'));
CREATE POLICY "Allow doctors and nurses to update patients" ON patients FOR UPDATE USING (get_user_role(auth.uid()) IN ('Doctor', 'Nurse', 'Charge Nurse'));
CREATE POLICY "Allow admins to do anything" ON patients FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Policies for the 'drugs' table
CREATE POLICY "Allow read access to all authenticated users" ON drugs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage drugs" ON drugs FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Policies for the 'tasks' table
CREATE POLICY "Allow read access to all authenticated users" ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow doctors to create tasks" ON tasks FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'Doctor');
CREATE POLICY "Allow assigned personnel to update tasks" ON tasks FOR UPDATE USING (assignee_id = auth.uid());
CREATE POLICY "Allow admins to do anything" ON tasks FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Policies for the 'personnel' table
CREATE POLICY "Allow users to view their own profile" ON personnel FOR SELECT USING (id = auth.uid());
CREATE POLICY "Allow admins to view all personnel" ON personnel FOR SELECT USING (get_user_role(auth.uid()) = 'Admin');
CREATE POLICY "Allow users to update their own profile" ON personnel FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Allow admins to manage personnel" ON personnel FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Policies for the 'shifts' table
CREATE POLICY "Allow charge nurses and admins to manage shifts" ON shifts FOR ALL USING (get_user_role(auth.uid()) IN ('Charge Nurse', 'Admin'));
CREATE POLICY "Allow personnel to see their own shifts" ON shifts FOR SELECT USING (personnel_id = auth.uid());
