-- Explainer videos join the pipeline: the agent storyboards story-size
-- slides plus a voiceover script; the admin turns them into a real video
-- file in the browser (canvas + MediaRecorder) and posts it by hand.

alter table content_queue drop constraint content_queue_format_check;
alter table content_queue add constraint content_queue_format_check
  check (format in ('post','caption','story_ad','feed_ad','carousel','video'));
