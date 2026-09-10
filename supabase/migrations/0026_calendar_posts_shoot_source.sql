-- Calendar posts made from a shoot deliverable carry source 'shoot', so the
-- Content tab can tell real media from template or AI plans.
alter table calendar_posts drop constraint if exists calendar_posts_source_check;
alter table calendar_posts add constraint calendar_posts_source_check
  check (source in ('manual', 'ai', 'template', 'shoot'));
