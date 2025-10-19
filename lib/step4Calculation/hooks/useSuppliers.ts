/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";

export type Supplier = { name: string; materials?: any[] } & Record<string, any>;
export type MaterialFlat = {
  id?: string;
  materialId?: string;
  name: string;
  gsm: string;
  cost: number;
  unit?: "sheet"|"packet";
  sheetsPerPacket?: number;
  supplierName?: string;
};

export function useSuppliers() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [materials, setMaterials] = React.useState<MaterialFlat[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Supplier[] = await res.json();
      setSuppliers(data);
      const flat: MaterialFlat[] = [];
      data.forEach((s) => {
        (s.materials ?? []).forEach((m: any) => {
          flat.push({
            id: m.id, materialId: m.materialId, name: m.name, gsm: m.gsm,
            cost: m.cost, unit: m.unit, sheetsPerPacket: m.sheetsPerPacket,
            supplierName: s.name,
          });
        });
      });
      setMaterials(flat);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  const getPaperPriceFromMaterials = React.useCallback(
    (paperName: string, gsm: string): number | null => {
      if (!materials.length) return null;
      const exact = materials.find(
        (m) => m.name?.toLowerCase().includes(paperName.toLowerCase()) && m.gsm === gsm
      ) ?? materials.find((m) => m.name?.toLowerCase().includes(paperName.toLowerCase()));
      if (!exact || exact.cost == null) return null;
      if (exact.unit === "packet" && exact.sheetsPerPacket) {
        return exact.cost / exact.sheetsPerPacket;
      }
      return exact.cost;
    },
    [materials]
  );

  return { suppliers, materials, loading, error, getPaperPriceFromMaterials };
}
