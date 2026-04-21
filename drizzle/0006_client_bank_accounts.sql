CREATE TABLE IF NOT EXISTS client_bank_accounts (
  id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  bank_name VARCHAR(128) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  account_type ENUM('checking','savings') NOT NULL,
  account_last4 VARCHAR(4) NOT NULL,
  account_number_enc VARBINARY(512) NOT NULL,
  key_version INT NOT NULL DEFAULT 1,
  account_number_hash VARCHAR(64) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_by VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX cba_client_idx (client_id),
  INDEX cba_client_active_idx (client_id, status),
  UNIQUE KEY cba_client_hash_uq (client_id, account_number_hash)
);

