/* eslint-disable @next/next/no-img-element */
"use client";
import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import StatusChip from "@/components/shared/StatusChip";
import { UserCheckIcon, Mail, Phone, Calendar, Building2, MapPin } from "lucide-react";
import { StatusPill } from "./ClientsTabel";

type SalesPerson = {
  id: string;
  salesPersonId: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  designation: string;
  department: string;
  hireDate: string;
  status: "Active" | "Inactive";
  profilePicture?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function ViewSalesPersonSheet({
  open,
  onOpenChange,
  person,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  person: SalesPerson | null;
  onEdit?: (p: SalesPerson) => void;
}) {
  // helper kecil
  const fmtDate = (iso?: string) =>
    !iso ? "-" : (iso.includes("T") ? iso.split("T")[0] : iso);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 overflow-y-auto"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
          <SheetHeader className="px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <UserCheckIcon className="w-5 h-5 text-[#27AAE1]" />
              Sales Person Details
            </SheetTitle>
            <SheetDescription className="text-slate-600">
              Lihat detail tanpa meninggalkan halaman.
            </SheetDescription>
          </SheetHeader>
        </div>

        {!person ? (
          <div className="p-6 text-sm text-slate-500">No data to display.</div>
        ) : (
          <div className="px-5 pb-5 pt-4 space-y-6">
            {/* ID + Status */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                {person.salesPersonId}
              </span>
              <StatusPill status={person.status}/>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3">
              {person.profilePicture ? (
                <img
                  src={person.profilePicture}
                  alt={`${person.name}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#27aae1]/20 text-[#27aae1] flex items-center justify-center">
                  <span className=" text-sm font-semibold">
                    {person.name?.charAt(0)?.toUpperCase() ?? "S"}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  Sales Person
                </div>
                <div className="text-base font-semibold text-slate-900 truncate">
                  {person.name}
                </div>
                <div className="text-sm text-slate-600">{person.designation}</div>
              </div>
            </div>

            <Divider />

            {/* Contact */}
            <Section title="Contact">
              <DL2
                items={[
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </span>
                    ),
                    value: person.email || "-",
                  },
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Phone
                      </span>
                    ),
                    value: person.phone || "-",
                  },
                ]}
              />
            </Section>

            <Divider />

            {/* Work */}
            <Section title="Work">
              <DL2
                items={[
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Department
                      </span>
                    ),
                    value: person.department || "-",
                  },
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Hire Date
                      </span>
                    ),
                    value: fmtDate(person.hireDate),
                  },
                ]}
              />
            </Section>

            <Divider />

            {/* Address */}
            <Section title="Address">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-900">
                  {person.address || "-"}
                </div>
                <div className="text-sm text-slate-700">
                  {[person.city, person.state, person.country]
                    .filter(Boolean)
                    .join(", ")}
                  {person.postalCode ? `, ${person.postalCode}` : ""}
                </div>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                Last updated: {fmtDate(person.updatedAt)}
              </div>
            </Section>

            {person.notes ? (
              <>
                <Divider />
                <Section title="Notes">
                  <div className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50/70 border rounded-md p-3">
                    {person.notes}
                  </div>
                </Section>
              </>
            ) : null}

            {/* Footer */}
            <div className="pt-2" />
          </div>
        )}

        <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t">
          <SheetFooter className="flex w-full items-center justify-end">
           
            <Button className=" bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Sub-komponen kecil */
function Divider() {
  return <div className="h-px bg-slate-200/80" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DL2({
  items,
}: {
  items: { label: React.ReactNode; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-0.5">
          <dt className="text-xs text-slate-500">{it.label}</dt>
          <dd className="text-sm font-medium text-slate-900 break-words">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
