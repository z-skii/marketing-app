-- creative_assets is private business data. Every other application table
-- has row level security on with no anonymous policies; 0027 left this one
-- open to the public API. The application reaches it through its own
-- connection, the same way it reaches content_shoots.
alter table creative_assets enable row level security;
