"use client";
import * as React from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2,  Globe2, MapPin, IdCard, Calendar, ListChecks } from "lucide-react";

type Client = {
  id: string;
  clientType: "Company" | "Individual" | string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  contactPerson?: string;
  role?: string;
  designation?: string;
  email?: string;
  emails?: string; // JSON string array
  phone?: string;
  countryCode?: string;
  trn?: string;
  hasNoTrn?: number;
  address?: string;
  city?: string;
  area?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;
  updatedAt?: string;
};

function Divider() {
  return <div className="h-px bg-slate-200/80" />;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
      {children}
    </section>
  );
}
function DL2({ items }: { items: { label: React.ReactNode; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-0.5">
          <dt className="text-xs text-slate-500">{it.label}</dt>
          <dd className="text-sm font-medium text-slate-900 break-words">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ViewClientSheet({
  open,
  onOpenChange,
  client,
  quotesCount = 0,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client | null;
  quotesCount?: number;
  onEdit?: (c: Client) => void;
}) {
  const fmtDate = (iso?: string) => (!iso ? "-" : (iso.includes("T") ? iso.split("T")[0] : iso));
  const getDisplayId = (id?: string) => {
    if (!id) return "CL000";
    if (id.startsWith("CL")) return id;
    const onlyNum = id.replace(/\D/g, "");
    if (onlyNum) return `CL${onlyNum.padStart(3, "0")}`;
    // quick hash
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
    const n = (Math.abs(h) % 999) + 1;
    return `CL${String(n).padStart(3, "0")}`;
  };

  let ccList: string[] = [];
  try {
    if (client?.emails) {
      const parsed = JSON.parse(client.emails);
      if (Array.isArray(parsed)) ccList = parsed.filter(Boolean);
    }
  } catch { /* ignore */ }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
          <SheetHeader className="px-5 py-4">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#27AAE1]" />
              Client Details
            </SheetTitle>
            <SheetDescription className="text-slate-600">
              Lihat detail client tanpa meninggalkan halaman.
            </SheetDescription>
          </SheetHeader>
        </div>

        {!client ? (
          <div className="p-6 text-sm text-slate-500">No data to display.</div>
        ) : (
          <div className="px-5 pb-5 pt-4 space-y-6">
            {/* ID + Status + Type */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center font-mono text-xs sm:text-sm font-medium text-slate-900 bg-blue-100 px-2.5 py-1.5 rounded-md">
                {getDisplayId(client.id)}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  client.status === "Inactive"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {client.status ?? "Active"}
              </span>
            </div>

            {/* Header name */}
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                {client.clientType === "Individual" ? "Individual" : "Company"}
              </div>
              <div className="text-base font-semibold text-slate-900">
                {client.clientType === "Individual"
                  ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.contactPerson
                  : client.companyName || client.contactPerson}
              </div>
              <div className="text-sm text-slate-600">{client.clientType === "Company" ? client.contactPerson : client.role}</div>
            </div>

            <Divider />

            {/* Contact */}
            <Section title="Contact">
              <DL2
                items={[
                  { label: <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Primary Email</span>, value: client.email || "-" },
                  { label: <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>, value: `${client.countryCode ?? ""} ${client.phone ?? "-"}`.trim() },
                ]}
              />
              {ccList.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-slate-500 mb-1">CC Emails</div>
                  <ul className="list-disc list-inside text-sm text-slate-900 space-y-1">
                    {ccList.map((em, i) => <li key={i}>{em}</li>)}
                  </ul>
                </div>
              )}
            </Section>

            <Divider />

            {/* Registration */}
            <Section title="Registration">
              <DL2
                items={[
                  { label: <span className="inline-flex items-center gap-1.5"><IdCard className="w-3.5 h-3.5" /> TRN</span>, value: client.hasNoTrn === 1 ? "No TRN" : (client.trn || "-") },
                  { label: <span className="inline-flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Role</span>, value: client.role || "-" },
                ]}
              />
            </Section>

            <Divider />

            {/* Address */}
            <Section title="Address">
              <DL2
                items={[
                  { label: <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Area</span>, value: client.area || "-" },
                  { label: <span className="inline-flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> Country</span>, value: client.country || "-" },
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-xs text-slate-500">State/Province</div>
                  <div className="text-sm font-medium text-slate-900">{client.state || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">City</div>
                  <div className="text-sm font-medium text-slate-900">{client.city || "-"}</div>
                </div>
              </div>
              {client.address ? (
                <div className="mt-3">
                  <div className="text-xs text-slate-500">Address</div>
                  <div className="text-sm font-medium text-slate-900">{client.address}</div>
                </div>
              ) : null}
            </Section>

            <Divider />

            {/* Meta */}
            <Section title="Meta">
              <DL2
                items={[
                  { label: <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Updated</span>, value: fmtDate(client.updatedAt) },
                  { label: "Quotes", value: quotesCount ?? 0 },
                ]}
              />
            </Section>
          </div>
        )}

        {/* Footer sticky */}
        <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t">
          <SheetFooter className="px-5 py-4 flex gap-2">
            {client && (
              <Button variant="outline" className="flex-1" onClick={() => onEdit?.(client)}>
                Edit
              </Button>
            )}
            <Button className="flex-1 bg-[#ea078b]" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
