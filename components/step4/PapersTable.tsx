"use client";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { QuoteFormData } from "@/types";

type Props = {
  formData: QuoteFormData;
  onChangePaper: (idx: number, field: keyof QuoteFormData["operational"]["papers"][0], value: string) => void;
  onOpenDetail: (globalIndex: number) => void;
};

export function PapersTable({ formData, onChangePaper, onOpenDetail }: Props) {
  const papers = formData.operational.papers;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Parent (W×H)</TableHead>
          <TableHead>Price/Sheet</TableHead>
          <TableHead>Sheets (Rec)</TableHead>
          <TableHead>Sheets (Enter)</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {papers.map((p, i) => (
          <TableRow key={i}>
            <TableCell>{i+1}</TableCell>
            <TableCell className="flex gap-2">
              <Input className="w-20" value={p.inputWidth ?? ""} onChange={(e)=>onChangePaper(i,"inputWidth", e.target.value)} placeholder="W" />
              <Input className="w-20" value={p.inputHeight ?? ""} onChange={(e)=>onChangePaper(i,"inputHeight", e.target.value)} placeholder="H" />
            </TableCell>
            <TableCell>
              <Input className="w-28" value={p.pricePerSheet ?? ""} onChange={(e)=>onChangePaper(i,"pricePerSheet", e.target.value)} placeholder="e.g. 0.5" />
            </TableCell>
            <TableCell>{p.recommendedSheets ?? "-"}</TableCell>
            <TableCell>
              <Input className="w-24" value={p.enteredSheets ?? ""} onChange={(e)=>onChangePaper(i,"enteredSheets", e.target.value)} />
            </TableCell>
            <TableCell>
              <button className="underline text-blue-600" onClick={()=>onOpenDetail(i)}>Detail</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
