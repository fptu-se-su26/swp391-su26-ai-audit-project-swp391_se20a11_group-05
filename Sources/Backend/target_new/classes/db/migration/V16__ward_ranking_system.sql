-- Ward Ranking System: monthly score snapshots and achievement badges

-- Monthly snapshot of ward scores (computed by scheduled job)
CREATE TABLE ward_ranking_snapshots (
    id                    BIGSERIAL PRIMARY KEY,
    ward_id               BIGINT NOT NULL REFERENCES wards(id),
    period_year           INT NOT NULL,
    period_month          INT NOT NULL,
    total_feedbacks       INT NOT NULL DEFAULT 0,
    resolved_count        INT NOT NULL DEFAULT 0,
    resolution_rate       NUMERIC(5,2) DEFAULT 0,
    avg_resolution_hours  NUMERIC(10,2) DEFAULT 0,
    speed_score           NUMERIC(5,2) DEFAULT 0,
    pending_rate          NUMERIC(5,2) DEFAULT 0,
    consistency_score     NUMERIC(5,2) DEFAULT 0,
    overall_score         NUMERIC(5,2) DEFAULT 0,
    rank_position         INT,
    previous_rank         INT,
    created_at            TIMESTAMP DEFAULT NOW(),
    UNIQUE(ward_id, period_year, period_month)
);

-- Achievement badges earned by wards
CREATE TABLE ward_achievements (
    id              BIGSERIAL PRIMARY KEY,
    ward_id         BIGINT NOT NULL REFERENCES wards(id),
    badge_code      VARCHAR(50) NOT NULL,
    badge_label     VARCHAR(100) NOT NULL,
    period_year     INT NOT NULL,
    period_month    INT NOT NULL,
    earned_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(ward_id, badge_code, period_year, period_month)
);

CREATE INDEX idx_ranking_ward_period ON ward_ranking_snapshots(ward_id, period_year, period_month);
CREATE INDEX idx_ranking_period ON ward_ranking_snapshots(period_year, period_month);
CREATE INDEX idx_achievement_ward ON ward_achievements(ward_id);
