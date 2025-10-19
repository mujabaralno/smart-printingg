/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/step4calculation/handlers/operational-handlers.ts
import type { QuoteFormData } from "@/types";

interface OperationalPaper {
    parentSheets?: number;
    recommendedSheets?: number;
    locked?: boolean;
  }

type SetFormData = React.Dispatch<React.SetStateAction<QuoteFormData>>;

function cloneOrMakePaperLike(sample?: OperationalPaper): OperationalPaper {
  // Create a minimal “paper-like” object that won’t upset TS at runtime.
  // We prefer cloning an existing row (keeps required keys)
  // and fall back to an empty object casted, to avoid compile errors.
  return (sample ? { ...sample } : ({} as unknown as OperationalPaper));
}

export function createParentSheetsHandler(setFormData: SetFormData) {
  return (index: number, value: number | null | undefined) => {
    setFormData(prev => {
      const papers = [...(prev.operational?.papers ?? [])] as unknown as OperationalPaper[];

      while (papers.length <= index) {
        // Clone the first paper if possible to preserve required keys;
        // otherwise cast an empty object (runtime-safe, type-softened).
        papers.push(cloneOrMakePaperLike(papers[0]));
      }

      const cur = papers[index] ?? cloneOrMakePaperLike(papers[0]);
      // Write extra key through a soft cast to avoid TS error
      (cur as any).parentSheets = value ?? undefined;

      papers[index] = cur;

      return {
        ...prev,
        operational: { ...prev.operational, papers: papers as any },
      };
    });
  };
}

export function createPlatesHandler(setFormData: SetFormData) {
  return (index: number, payload: Partial<{ colorsF: number; colorsB?: number; sides?: 1 | 2 }>) => {
    setFormData(prev => {
      const papers = [...(prev.operational?.papers ?? [])] as unknown as OperationalPaper[];

      while (papers.length <= index) {
        papers.push(cloneOrMakePaperLike(papers[0]));
      }

      const cur = papers[index] ?? cloneOrMakePaperLike(papers[0]);
      // Merge known fields if they exist in your schema; otherwise, write via any
      if (payload.colorsF != null) (cur as any).colorsF = payload.colorsF;
      if (payload.colorsB != null) (cur as any).colorsB = payload.colorsB;
      if (payload.sides   != null) (cur as any).sides   = payload.sides;

      papers[index] = cur;

      return {
        ...prev,
        operational: { ...prev.operational, papers: papers as any },
      };
    });
  };
}

export function createOperationalFieldSetter(setFormData: SetFormData) {
  return <K extends keyof QuoteFormData["operational"]>(
    key: K,
    value: QuoteFormData["operational"][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      operational: {
        ...prev.operational,
        [key]: value,
      },
    }));
  };
}

export function createLockRowHandler(setFormData: SetFormData) {
  return (index: number, locked: boolean) => {
    setFormData(prev => {
      const papers = [...(prev.operational?.papers ?? [])] as unknown as OperationalPaper[];

      while (papers.length <= index) {
        papers.push(cloneOrMakePaperLike(papers[0]));
      }

      const cur = papers[index] ?? cloneOrMakePaperLike(papers[0]);
      (cur as any).locked = locked;

      papers[index] = cur;

      return {
        ...prev,
        operational: { ...prev.operational, papers: papers as any },
      };
    });
  };
}
