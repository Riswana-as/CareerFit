CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  headline VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(100),
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  layout_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255),
  original_file_path VARCHAR(500),
  file_mime_type VARCHAR(100),
  file_size INTEGER,
  parsed_json JSONB NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  raw_text TEXT NOT NULL,
  source_url VARCHAR(500),
  detected_role VARCHAR(255),
  detection_confidence INTEGER DEFAULT 0,
  department VARCHAR(100),
  experience_level VARCHAR(50),
  location VARCHAR(100),
  employment_type VARCHAR(50),
  parsed_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  target_job_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  version_number INTEGER NOT NULL,
  version_name VARCHAR(255) NOT NULL,
  target_role VARCHAR(255),
  content JSONB NOT NULL,
  ats_score INTEGER DEFAULT 0,
  score_breakdown JSONB,
  changes_summary JSONB,
  unadded_items JSONB,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_sections (
  id UUID PRIMARY KEY,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL,
  display_order INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  category VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  proficiency VARCHAR(50),
  is_verified BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  is_current BOOLEAN DEFAULT FALSE,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  technologies JSONB DEFAULT '[]'::jsonb,
  url VARCHAR(500),
  relevance_score INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS educations (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  gpa VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  issue_date VARCHAR(50),
  expiration_date VARCHAR(50),
  credential_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS job_requirements (
  id UUID PRIMARY KEY,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  requirement_text TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  importance_weight INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS resume_analyses (
  id UUID PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_matches (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES resume_analyses(id) ON DELETE CASCADE,
  requirement_id UUID,
  requirement_text TEXT,
  match_status VARCHAR(50) NOT NULL,
  matching_text TEXT,
  explanation TEXT,
  confidence INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ats_scores (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES resume_analyses(id) ON DELETE CASCADE,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  keyword_match INTEGER NOT NULL,
  technical_skills INTEGER NOT NULL,
  experience_relevance INTEGER NOT NULL,
  education INTEGER NOT NULL,
  responsibilities INTEGER NOT NULL,
  structure INTEGER NOT NULL,
  scoring_weights JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE CASCADE,
  section VARCHAR(50) NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  reason TEXT NOT NULL,
  actionable_step TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  job_url VARCHAR(500),
  applied_date VARCHAR(50),
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'saved',
  notes TEXT,
  interview_date VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_notes (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  interview_date VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  default_template VARCHAR(50) DEFAULT 'modern',
  scoring_weights JSONB DEFAULT '{"skills":30,"experience":25,"keywords":20,"responsibilities":15,"education":5,"structure":5}'::jsonb,
  notification_preferences JSONB DEFAULT '{"email":true,"alerts":true}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  metadata JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume ON resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user ON job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
