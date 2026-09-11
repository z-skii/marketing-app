-- Design reboot: the creative system also keeps UI concept mockups and
-- concept art, so a direction's visuals live next to the campaign assets.
alter table creative_assets drop constraint if exists creative_assets_type_check;
alter table creative_assets add constraint creative_assets_type_check
  check (type in ('STORY_AD', 'RECREATE_COVER', 'CAR_AD_PREVIEW', 'SOCIAL_POST', 'CAMPAIGN_COVER', 'BRAND_ASSET', 'UI_CONCEPT', 'CONCEPT_ART'));
