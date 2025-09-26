import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Edit } from "lucide-react";
import { QuoteStatus } from "@/types";

export default function StatusPill({ status }: { status: QuoteStatus }) {
  if (status === "Approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5" />
          Done
        </span>
      </Badge>
    );
  }
  if (status === "Pending") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
          Pending
        </span>
      </Badge>
    );
  }
  if (status === "Rejected") {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      </Badge>
    );
  }
  if (status === "Draft") {
    return (
      <Badge className="bg-slate-100 text-slate-700 border border-slate-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Edit className="h-3.5 w-3.5" />
          Draft
        </span>
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border rounded-full px-2.5 py-1 text-[11px] font-medium">
      {status}
    </Badge>
  );
}
