import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Repeat } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/currency";
import { formatDateTime, formatLongDate } from "@/lib/utils/time";
import { BUCKET_LABEL, BUCKET_TONE, paymentLabel, type AccountingBucket } from "@/lib/expenses/constants";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { KV } from "@/components/ui/stat";
import { Alert } from "@/components/ui/form";
import { ExpenseDetailActions } from "@/components/expenses/expense-detail-actions";

function bytesLabel(n: number | null | undefined): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireManagerContext();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const [{ data: row }, { data: categories }] = await Promise.all([
    supabase.from("expenses").select("*, expense_categories(name, bucket), locations(name, timezone), receipts(*)").eq("id", id).eq("organization_id", ctx.org.id).maybeSingle(),
    supabase.from("expense_categories").select("id, name, bucket, is_active").eq("organization_id", ctx.org.id).order("sort_order").order("name"),
  ]);
  if (!row || !ctx.locations.some((l) => l.id === row.location_id)) notFound();

  const cat = row.expense_categories as { name: string; bucket: string } | null;
  const loc = row.locations as { name: string; timezone: string } | null;
  const receipt = row.receipts as NonNullable<typeof row.receipts> | null;
  const tz = loc?.timezone ?? ctx.org.timezone;
  const currency = ctx.settings.currency;
  const bucket = (cat?.bucket ?? "other") as AccountingBucket;

  let signedUrl: string | null = null;
  if (receipt) {
    const { data } = await supabase.storage.from(receipt.storage_bucket || "receipts").createSignedUrl(receipt.storage_path, 600);
    signedUrl = data?.signedUrl ?? null;
  }
  const isImage = (receipt?.content_type ?? "").startsWith("image/");
  const isPdf = (receipt?.content_type ?? "").includes("pdf");
  const canWrite = ctx.can("can_add_expenses");

  return (
    <div>
      <PageHeader back={{ href: "/expenses", label: "Expenses" }}
        title={<span className="inline-flex items-center gap-2">{row.vendor || cat?.name || "Expense"}<StatusBadge kind="expense" value={row.status} /></span>}
        description={<>{formatLongDate(row.business_date)} · {loc?.name ?? "—"} · <span className="tnum font-medium text-text">{formatMoney(Number(row.amount), { currency })}</span></>}
        actions={canWrite ? (
          <ExpenseDetailActions organizationId={ctx.org.id} locations={ctx.locations} categories={categories ?? []} today={ctx.today} currency={currency} status={row.status}
            initial={{ id: row.id, location_id: row.location_id, business_date: row.business_date, amount: Number(row.amount), category_id: row.category_id, payment_method: row.payment_method,
              vendor: row.vendor, description: row.description, status: row.status, receipt: receipt ? { id: receipt.id, name: receipt.original_filename ?? "Receipt" } : null }} />
        ) : undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Details" />
          <CardBody className="divide-y divide-border">
            <KV label="Amount" value={formatMoney(Number(row.amount), { currency })} strong />
            <KV label="Date" value={formatLongDate(row.business_date)} />
            <KV label="Store" value={loc?.name ?? "—"} />
            <KV label="Category" value={<span className="inline-flex items-center gap-1.5">{cat?.name ?? "—"}<Badge tone={BUCKET_TONE[bucket]}>{BUCKET_LABEL[bucket]}</Badge></span>} />
            <KV label="Payment" value={paymentLabel(row.payment_method)} />
            <KV label="Vendor" value={row.vendor || "—"} />
            <KV label="Description" value={<span className="text-right whitespace-pre-wrap break-words">{row.description || "—"}</span>} />
            <KV label="Status" value={<StatusBadge kind="expense" value={row.status} />} />
            <KV label="Paid at" value={row.paid_at ? formatDateTime(row.paid_at, tz) : "—"} />
            <KV label="Recurring" value={row.recurring_expense_id ? <Link href="/expenses/recurring" className="inline-flex items-center gap-1 text-accent hover:underline"><Repeat className="h-3.5 w-3.5" />Generated from a schedule</Link> : "No"} />
            <KV label="Created" value={formatDateTime(row.created_at, tz)} />
            {row.updated_at !== row.created_at && <KV label="Last edited" value={formatDateTime(row.updated_at, tz)} />}
          </CardBody>
          {row.status === "expected" && (
            <CardBody><Alert tone="warn">Expected expenses are not part of the day&apos;s totals until they are marked paid.</Alert></CardBody>
          )}
        </Card>

        <div className="lg:col-span-3 space-y-3">
          <Card>
            <CardHeader title="Receipt" description={receipt ? `${receipt.original_filename ?? "file"} · ${receipt.content_type ?? "unknown type"} · ${bytesLabel(receipt.bytes)}` : "No receipt attached"}
              action={signedUrl ? <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-accent hover:underline"><ExternalLink className="h-3.5 w-3.5" />Open</a> : undefined} />
            <CardBody>
              {!receipt && <p className="text-[13px] text-text-3">Attach a photo or PDF by editing this expense.</p>}
              {receipt && !signedUrl && <Alert tone="danger">The receipt file could not be signed for viewing. It may have been removed from storage.</Alert>}
              {receipt && signedUrl && isImage && (
                // Signed URLs are short-lived and host-external; next/image cannot optimise them.
                // eslint-disable-next-line @next/next/no-img-element
                <a href={signedUrl} target="_blank" rel="noopener noreferrer"><img src={signedUrl} alt={receipt.original_filename ?? "Receipt"} className="max-h-[520px] w-auto rounded-md border border-border bg-surface-2" /></a>
              )}
              {receipt && signedUrl && !isImage && (
                <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] hover:bg-surface-2">
                  <FileText className="h-4 w-4 text-text-3" />{isPdf ? "Open PDF receipt" : "Download receipt"}<span className="text-text-3">· link valid 10 minutes</span>
                </a>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Receipt OCR" description="Automatic extraction of amount, date and vendor from the receipt." />
            <CardBody>
              {!receipt ? (
                <p className="text-[13px] text-text-3">Nothing to read — no receipt is attached.</p>
              ) : receipt.ocr_status === "none" ? (
                <Alert tone="info" title="OCR not enabled yet">Nothing has been extracted from this receipt. The fields below are reserved and will fill in once receipt scanning is switched on; until then the values you typed are the only source of truth.</Alert>
              ) : (
                <p className="text-[13px] text-text-2">Status: <span className="font-medium">{receipt.ocr_status}</span></p>
              )}
              {receipt && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <KV label="Status" value={receipt.ocr_status} />
                  <KV label="Amount" value={receipt.ocr_amount != null ? formatMoney(Number(receipt.ocr_amount), { currency }) : "—"} />
                  <KV label="Date" value={receipt.ocr_date ? formatLongDate(receipt.ocr_date) : "—"} />
                  <KV label="Vendor" value={receipt.ocr_vendor ?? "—"} />
                  <KV label="Tax" value={receipt.ocr_tax != null ? formatMoney(Number(receipt.ocr_tax), { currency }) : "—"} />
                  <KV label="Category suggestion" value={receipt.ocr_category_suggestion ?? "—"} />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
