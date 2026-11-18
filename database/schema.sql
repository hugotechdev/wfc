-- WFC Portal V6 PostgreSQL Schema (Railway Ready)
CREATE TABLE IF NOT EXISTS wfc_kv_store (
  store_key VARCHAR(64) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wfc_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_id VARCHAR(64),
  actor_name VARCHAR(160),
  action VARCHAR(120) NOT NULL,
  target VARCHAR(160),
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wfc_audit_created_at ON wfc_audit_logs (created_at DESC);
