import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wkvdleevitpdbmeukurm.supabase.co", "sb_publishable_XqxEbrahz6SYLnG1W2bbfQ_locEnHCb");
const r = await s.auth.signInWithPassword({ email: "owner@storeday.test", password: "Password123!" });
console.log(JSON.stringify(r.error ?? { ok: true, user: r.data.user?.id }, null, 1).slice(0, 500));
