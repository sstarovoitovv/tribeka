CREATE TABLE IF NOT EXISTS leads (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(80) NOT NULL,
    message TEXT NULL,
    source_origin VARCHAR(255) NULL,
    source_url VARCHAR(2048) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,
    consent_version VARCHAR(32) NOT NULL,
    policy_version VARCHAR(32) NOT NULL,
    consent_accepted_at DATETIME NOT NULL,
    notification_status VARCHAR(16) NOT NULL DEFAULT 'pending',
    notification_sent_at DATETIME NULL,
    notification_error VARCHAR(255) NULL,
    manager_note TEXT NULL,
    contacted_at DATETIME NULL,
    closed_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_leads_public_id (public_id),
    KEY idx_leads_status_created (status, created_at),
    KEY idx_leads_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lead_attachments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    lead_id BIGINT UNSIGNED NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    storage_path VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    mime_type VARCHAR(127) NOT NULL,
    size_bytes BIGINT UNSIGNED NOT NULL,
    sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lead_attachments_lead_id (lead_id),
    CONSTRAINT fk_lead_attachments_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
