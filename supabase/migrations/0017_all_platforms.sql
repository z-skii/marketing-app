-- The content pipeline covers every channel: Threads, Instagram, Facebook,
-- and TikTok, with carousels (multi-slide image sets) alongside single
-- posts and ads. Every piece of content carries at least one rendered
-- image; carousels keep all their slides in asset_urls.

alter table content_queue drop constraint content_queue_platform_check;
alter table content_queue add constraint content_queue_platform_check
  check (platform in ('threads','instagram','facebook','tiktok'));

alter table content_queue drop constraint content_queue_format_check;
alter table content_queue add constraint content_queue_format_check
  check (format in ('post','caption','story_ad','feed_ad','carousel'));

alter table content_queue add column if not exists asset_urls text[];
