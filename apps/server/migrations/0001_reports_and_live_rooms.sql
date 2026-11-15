-- What a screen or the server said went wrong, kept 30 days
-- (`REPORT_RETENTION_MS`). The filterable fields are columns; `context` is the
-- whole report as its schema accepted it, for the page that expands one.
-- No column holds an address, a nickname, an answer or a session id.
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('client', 'server')),
  kind TEXT NOT NULL,
  code TEXT,
  error_name TEXT,
  error_message TEXT,
  server_build TEXT NOT NULL,
  client_build TEXT,
  browser_name TEXT,
  browser_version TEXT,
  system TEXT,
  role TEXT,
  game TEXT,
  phase TEXT,
  room_code TEXT,
  context TEXT NOT NULL
);

CREATE INDEX reports_by_received_at ON reports (received_at);
CREATE INDEX reports_by_kind ON reports (kind, received_at);

-- One row per room a Durable Object holds open, written by the room itself as
-- it opens, changes game or phase, gains or loses a seat, and closes. Swept a
-- day after it last moved (`LIVE_ROOM_STALE_MS`).
CREATE TABLE rooms_live (
  code TEXT PRIMARY KEY,
  opened_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  game TEXT,
  phase TEXT NOT NULL,
  round_index INTEGER,
  seat_count INTEGER NOT NULL DEFAULT 0,
  wall_count INTEGER NOT NULL DEFAULT 0,
  closed_at INTEGER
);

CREATE INDEX rooms_live_by_updated_at ON rooms_live (updated_at);
