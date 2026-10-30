-- TK3 KO Tournament Manager · Fase 1
-- The backend creates this table on startup if it does not exist;
-- this script documents the structure and allows creating it by hand.

CREATE TABLE IF NOT EXISTS participants (
    id         INT          NOT NULL AUTO_INCREMENT,
    nick       VARCHAR(40)  NOT NULL,
    logo       VARCHAR(16)  NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_participants_nick (nick)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
