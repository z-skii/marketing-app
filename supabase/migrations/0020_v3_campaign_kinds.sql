-- TapMart V3: the three ways a person earns. New enum values have to commit
-- before anything references them, so this file only adds the values; 0021
-- does the rest.
alter type campaign_kind add value if not exists 'recreate_reel';
alter type campaign_kind add value if not exists 'instagram_story';
