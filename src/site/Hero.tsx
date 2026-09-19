"use client";

import Link from "next/link";
import { CarStage } from "@/ds/car/CarStage";
import { Float, Parallax, Reveal, Stagger, Item } from "@/ds/motion";
import { CheckCircleIcon, ArrowRightIcon, CarIcon, PlayIcon } from "@/ds/icons";
import { M } from "@/v3/media";
import { Phone } from "./Devices";

/**
 * The opening: DRIVE. RECREATE. SHARE. GET PAID. and a composition that
 * demonstrates TapMart before describing it: the isolated car with a
 * placement, a Story on a phone, a creator's Reel, a business, an
 * approval with its pay, a campaign chip. Every object drifts on its own;
 * every amount and name is an example and the strip says so.
 */
export function Hero({ open }: { open: { href: string; label: string } | null }) {
  return (
    <section className="lp-hero" id="top" aria-label="TapMart">
      <div className="lp-wrap">
        <div className="lp-hero-grid">
          <div>
            <Stagger gap={0.07} amount={0.1}>
              <h1 className="lp-hero-words" aria-label="Drive. Recreate. Share. Get paid.">
                <Item><span className="lp-hero-word">Drive.</span></Item>
                <Item><span className="lp-hero-word">Recreate.</span></Item>
                <Item><span className="lp-hero-word">Share.</span></Item>
                <Item><span className="lp-hero-word is-red">Get paid.</span></Item>
              </h1>
              <Item><p className="t-lead lp-hero-lead">Local businesses pay you to put their message on your car, your Reels and your Stories. Businesses get the content, the creators and the system that runs it.</p></Item>
              <Item>
                <div className="lp-hero-cta">
                  {open ? <Link href={open.href} className="btn btn-signal btn-lg">{open.label} <ArrowRightIcon size={18} aria-hidden /></Link> : <Link href="/sign-up" className="btn btn-signal btn-lg">Start earning <ArrowRightIcon size={18} aria-hidden /></Link>}
                  <a href="#business" className="btn btn-lg">For businesses</a>
                </div>
              </Item>
              <Item><p className="lp-strip"><span className="status-dot" aria-hidden />People, businesses and amounts shown are examples, not real accounts.</p></Item>
            </Stagger>
          </div>

          <Reveal delay={0.15} y={32} amount={0.1}>
            <div className="lp-comp" aria-hidden>
              <Parallax className="lp-comp-car" range={[10, -30]}>
                <CarStage car="wagon" zone="rear_door" artwork="/uploads/seed/demo-car-artwork.png" priority tilt={6} scrollTurn={4} label="A wagon with a campaign on its rear door" />
              </Parallax>
              <Float className="lp-comp-phone" amplitude={10} duration={7}>
                <Phone>
                  <picture><source type="image/avif" srcSet={`${M.story(480)} 480w, ${M.story(720)} 720w`} sizes="220px" /><img src={M.storyOriginal} alt="" loading="eager" /></picture>
                  <div className="lp-story-bars"><span><i style={{ width: "100%" }} /></span><span><i style={{ width: "40%" }} /></span><span /></div>
                </Phone>
              </Float>
              <Float className="lp-comp-reel" amplitude={7} duration={8} delay={0.8}>
                <div className="media-frame is-lg" style={{ aspectRatio: "4 / 5", boxShadow: "var(--tm-shadow-float)" }}>
                  <picture><source type="image/avif" srcSet={`${M.mayaLatte(480)} 480w, ${M.mayaLatte(800)} 800w`} sizes="200px" /><img src={M.mayaLatte(480)} alt="" loading="eager" /></picture>
                  <span className="glass-tag is-dark" style={{ position: "absolute", left: 10, top: 10 }}><PlayIcon size={12} weight="fill" aria-hidden />Recreate</span>
                </div>
              </Float>
              <Float className="lp-comp-earn" amplitude={6} duration={6.5} delay={0.4}>
                <div className="glass-panel lp-glass">
                  <span className="lp-obj-label" style={{ color: "var(--tm-success)" }}><CheckCircleIcon size={16} weight="fill" aria-hidden />Approved</span>
                  <div className="lp-obj-money" style={{ marginTop: 6 }}>US$75</div>
                  <div className="t-meta">Counter pour · Loopday Coffee</div>
                </div>
              </Float>
              <Float className="lp-comp-biz" amplitude={8} duration={7.5} delay={1.2}>
                <div className="card" style={{ padding: 10, display: "grid", gap: 8 }}>
                  <div className="media-frame is-sm" style={{ aspectRatio: "16 / 10" }}>
                    <img src={M.contentCounter()} alt="" loading="eager" />
                  </div>
                  <div style={{ padding: "0 4px 4px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: "18px" }}>Loopday Coffee</div>
                    <div className="t-meta">Raleigh · 3 open campaigns</div>
                  </div>
                </div>
              </Float>
              <Float className="lp-comp-chip" amplitude={5} duration={5.5} delay={0.2}>
                <span className="glass-tag is-glass" style={{ height: 34, padding: "0 12px", fontSize: 13 }}><CarIcon size={16} aria-hidden />Rear door · US$110 a month</span>
              </Float>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
