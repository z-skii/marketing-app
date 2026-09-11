/**
 * TapMart's OpenAI creative layer.
 *
 *   models.ts     the router: which model and effort does each job get
 *   client.ts     Responses API (background + poll) and Images API
 *   prompts.ts    who the director is, and the TapMart material it sees
 *   schemas.ts    the strict JSON shapes it returns
 *   director.ts   designSystem, designScreen, reviewScreen, designCreative,
 *                 reviewCreative, writeCopy
 *   images.ts     generateImage, editImage
 *   creative.ts   the brief -> render -> review -> edit loop and the job
 *                 entry points (Story ads, Recreate covers, car ads, photo
 *                 creatives, brand assets)
 *   assets.ts     the creative asset library (creative_assets)
 *
 * The director (gpt-6-astra) designs, directs and judges. Image models
 * render. Claude Code implements UI in code. A person approves.
 */
export * from "./models";
export { isOpenAiConfigured, OpenAiError, type Usage, type ImageBytes } from "./client";
export * from "./director";
export * from "./images";
export * from "./creative";
export * from "./assets";
