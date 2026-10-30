-- TK3 KO Tournament Manager · Fases 1 a 3
-- The backend creates these tables on startup if they do not exist;
-- this script documents the structure and allows creating them by hand.

CREATE TABLE IF NOT EXISTS participants (
    id         INT          NOT NULL AUTO_INCREMENT,
    nick       VARCHAR(40)  NOT NULL,
    logo       VARCHAR(16)  NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_participants_nick (nick)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- status: PREPARACION (players can still change) | GENERADO (the draw is done)
--         EN_CURSO (results being entered) | FINALIZADO (champion: no more changes)
CREATE TABLE IF NOT EXISTS tournaments (
    id                   INT          NOT NULL AUTO_INCREMENT,
    name                 VARCHAR(80)  NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PREPARACION',
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bracket_generated_at DATETIME     NULL,
    champion_id          INT          NULL,
    finished_at          DATETIME     NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (champion_id) REFERENCES participants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Players enrolled in each tournament (N:M). The primary key prevents duplicates.
CREATE TABLE IF NOT EXISTS tournament_participants (
    tournament_id  INT NOT NULL,
    participant_id INT NOT NULL,
    PRIMARY KEY (tournament_id, participant_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bracket matches. position orders the matches of a round:
-- matches 2k and 2k+1 feed match k of the next round.
-- A BYE has participant2 NULL and its winner is participant1.
CREATE TABLE IF NOT EXISTS matches (
    id              INT       NOT NULL AUTO_INCREMENT,
    tournament_id   INT       NOT NULL,
    round           INT       NOT NULL,
    position        INT       NOT NULL,
    participant1_id INT       NULL,
    participant2_id INT       NULL,
    winner_id       INT       NULL,
    is_bye          BOOLEAN   NOT NULL DEFAULT FALSE,
    resolved_at     DATETIME  NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_matches_slot (tournament_id, round, position),
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
    FOREIGN KEY (participant1_id) REFERENCES participants (id),
    FOREIGN KEY (participant2_id) REFERENCES participants (id),
    FOREIGN KEY (winner_id) REFERENCES participants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 3 migration for databases created in phase 2 (the backend runs it on startup):
-- ALTER TABLE tournaments ADD COLUMN champion_id INT NULL REFERENCES participants (id);
-- ALTER TABLE tournaments ADD COLUMN finished_at DATETIME NULL;
