import { Building2Icon, FileTextIcon, LayoutDashboardIcon, LucideIcon, PackageIcon, SquarePenIcon, UsersIcon } from "lucide-react";

export type SidebarItem = {
  label: string;
  route: string;
  icons: LucideIcon;
};

export const getSidebarItems = (role: "admin" | "estimator"): SidebarItem[] => {
  const common: SidebarItem[] = [
    { label: "Dashboard",          route: "/",                 icons: LayoutDashboardIcon },
    { label: "Create Quote",       route: "/create-quote",     icons: SquarePenIcon },
    { label: "Quote Management",   route: "/quote-management", icons: FileTextIcon },
    { label: "Client Management",  route: "/client-management",icons: Building2Icon },
    { label: "Supplier Management",route: "/supplier-management", icons: PackageIcon },
  ];

  if (role === "admin") {
    return [
      ...common,
      { label: "User Management", route: "/user-management", icons: UsersIcon },
    ];
  }
  return common;
};

export const dataRecentQuote = [
  {
    quoteId: "QT-2024-0718-001",
    clientName: "Eagen Inc",
    date: "25 JULY 2025",
    amount: "$2,450.00",
    status: "Approved",
  },
  {
    quoteId: "QT-2024-0718-002",
    clientName: "Maxtion Development",
    date: "19 JULY 2025",
    amount: "$2,750.00",
    status: "Pending",
  },
];

export const stepCreateQuote = [
    {
        numberStep: "1",
        label: "Create A Quote"
    },
    {
        numberStep: "2",
        label: "Customer Detail"
    },
    {
        numberStep: "3",
        label: "Product Spec"
    },
    {
        numberStep: "4",
        label: "Operational"
    },
    {
        numberStep: "5",
        label: "Quotation"
    },
]

// constants/quotes.ts
export type QuoteStatus = "Approved" | "Pending" | "Rejected";

export interface QuoteRow {
  id: string;
  clientName: string;
  contactPerson: string;
  date: string;       // YYYY-MM-DD
  amount: number;
  status: QuoteStatus;
  userId: string;
  productName: string;
  quantity: number;
}

export const users = [
  { id: "u1", name: "Admin" },
  { id: "u2", name: "Estimator" },
] as const;

export const quotes: QuoteRow[] = [
  {
    id: "QT-2025-0718-001",
    clientName: "Eagan Inc.",
    contactPerson: "John Eagan",
    date: "2025-07-18",
    amount: 204.75,
    status: "Approved",
    userId: "u1",
    productName: "Business Card",
    quantity: 1000,
  },
  {
    id: "QT-2025-0718-002",
    clientName: "Horizon Press",
    contactPerson: "Emma White",
    date: "2025-07-18",
    amount: 1520.0,
    status: "Pending",
    userId: "u2",
    productName: "Art Book",
    quantity: 250,
  },
  {
    id: "QT-2025-0719-003",
    clientName: "Nova Prints",
    contactPerson: "Liam Carter",
    date: "2025-07-19",
    amount: 880.5,
    status: "Rejected",
    userId: "u1",
    productName: "Poster A2",
    quantity: 300,
  },
  {
    id: "QT-2025-0720-004",
    clientName: "Galaxy Media",
    contactPerson: "Sophia Adams",
    date: "2025-07-20",
    amount: 310.0,
    status: "Approved",
    userId: "u3",
    productName: "Flyer A5",
    quantity: 2000,
  },
  {
    id: "QT-2025-0720-005",
    clientName: "PrintX Solutions",
    contactPerson: "David Thompson",
    date: "2025-07-20",
    amount: 4500.75,
    status: "Approved",
    userId: "u2",
    productName: "Magazine",
    quantity: 500,
  },
  {
    id: "QT-2025-0721-006",
    clientName: "Creative Hub",
    contactPerson: "Olivia Martinez",
    date: "2025-07-21",
    amount: 120.0,
    status: "Pending",
    userId: "u1",
    productName: "Sticker Pack",
    quantity: 500,
  },
  {
    id: "QT-2025-0721-007",
    clientName: "Urban Prints",
    contactPerson: "Noah Wilson",
    date: "2025-07-21",
    amount: 1999.99,
    status: "Approved",
    userId: "u3",
    productName: "Banner 3x2m",
    quantity: 50,
  },
  {
    id: "QT-2025-0722-008",
    clientName: "Pixel Studio",
    contactPerson: "Isabella Taylor",
    date: "2025-07-22",
    amount: 750.0,
    status: "Rejected",
    userId: "u1",
    productName: "Brochure",
    quantity: 1000,
  },
  {
    id: "QT-2025-0722-009",
    clientName: "Bright Ideas Co.",
    contactPerson: "James Anderson",
    date: "2025-07-22",
    amount: 640.5,
    status: "Approved",
    userId: "u2",
    productName: "Menu Card",
    quantity: 700,
  },
  {
    id: "QT-2025-0723-010",
    clientName: "Visionary Prints",
    contactPerson: "Mia Harris",
    date: "2025-07-23",
    amount: 980.75,
    status: "Pending",
    userId: "u3",
    productName: "Catalogue",
    quantity: 150,
  },
];


export interface ClientRow {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
}

export const clients: ClientRow[] = [
  { id: "C-001", companyName: "Eagan Inc.",      contactPerson: "John Eagan",  email: "john.e@eagan.com",     phone: "+971 50 123 4567", status: "Active" },
  { id: "C-002", companyName: "Maxtion Dev",     contactPerson: "Liam Park",   email: "liam@maxtion.dev",     phone: "+971 50 222 3344", status: "Active" },
  { id: "C-003", companyName: "Candor Ltd",      contactPerson: "Alice Tan",   email: "alice@candor.co",      phone: "+971 50 333 7788", status: "Active" },
  { id: "C-004", companyName: "Delta Co.",       contactPerson: "Jin Woo",     email: "jin@delta.co",         phone: "+971 50 994 1100", status: "Active" },
  { id: "C-005", companyName: "Echo GmbH",       contactPerson: "Lena Meyer",  email: "lena@echo.de",         phone: "+49 160 111 2223", status: "Active" },
  { id: "C-006", companyName: "Foxtrot BV",      contactPerson: "Tariq Aziz",  email: "tariq@foxtrot.nl",     phone: "+31 6 1234 5678", status: "Active" },
  { id: "C-007", companyName: "Gamma LLC",       contactPerson: "Sara Gomez",  email: "sara@gammallc.com",    phone: "+1 415 555 1212", status: "Active" },
  { id: "C-008", companyName: "Helios Pte",      contactPerson: "Mei Lin",     email: "mei@helios.sg",        phone: "+65 8123 4567", status: "Active" },
  { id: "C-009", companyName: "Iris Studio",     contactPerson: "Rani Putri",  email: "rani@iris.studio",     phone: "+62 812 3456 7890", status: "Active" },
  { id: "C-010", companyName: "Juno Sdn Bhd",    contactPerson: "Farid Shah",  email: "farid@juno.my",        phone: "+60 12 345 6789", status: "Active" },

  { id: "C-011", companyName: "Kappa Inc",       contactPerson: "Becky Lee",   email: "becky@kappa.com",      phone: "+852 6123 4567", status: "Active" },
  { id: "C-012", companyName: "Lumen Labs",      contactPerson: "Jorge Ruiz",  email: "jorge@lumenlabs.io",   phone: "+34 655 111 222", status: "Active" },
  { id: "C-013", companyName: "Mango Corp",      contactPerson: "Dani So",     email: "dani@mango.com",       phone: "+82 10 2345 6789", status: "Active" },
  { id: "C-014", companyName: "Nexus Ltd",       contactPerson: "Ken Wong",    email: "ken@nexus.hk",         phone: "+852 5123 9876", status: "Active" },
  { id: "C-015", companyName: "Orion SA",        contactPerson: "Pierre Lac",  email: "pierre@orion.fr",      phone: "+33 6 12 34 56 78", status: "Active" },
  { id: "C-016", companyName: "Pluto LLP",       contactPerson: "Wira Adi",    email: "wira@pluto.com",      phone: "+62 813 7777 1212", status: "Active" },
  { id: "C-017", companyName: "Quark AB",        contactPerson: "Anders B",    email: "anders@quark.se",      phone: "+46 70 123 4567", status: "Active" },
  { id: "C-018", companyName: "Radian BV",       contactPerson: "Ivo K",       email: "ivo@radian.eu",        phone: "+31 6 8765 4321", status: "Active" },
  { id: "C-019", companyName: "Sigma Oy",        contactPerson: "Tiina K",     email: "tiina@sigma.fi",       phone: "+358 40 123 4567", status: "Active" },
  { id: "C-020", companyName: "Titan Pty",       contactPerson: "Noah Reed",   email: "noah@titan.au",        phone: "+61 412 345 678", status: "Active" },

  { id: "C-021", companyName: "Umbra SAS",       contactPerson: "Luc Martin",  email: "luc@umbra.fr",         phone: "+33 6 99 88 77 66", status: "Active" },
  { id: "C-022", companyName: "Vega NV",         contactPerson: "Eva Jans",    email: "eva@vega.be",          phone: "+32 470 12 34 56", status: "Active" },
  { id: "C-023", companyName: "Wave GmbH",       contactPerson: "Jonas K",     email: "jonas@wave.de",        phone: "+49 171 234 5678", status: "Active" },
  { id: "C-024", companyName: "Xenon KK",        contactPerson: "Akira Mori",  email: "akira@xenon.co.jp",    phone: "+81 90 1234 5678", status: "Active" },
  { id: "C-025", companyName: "Yonder PLC",      contactPerson: "Holly B",     email: "holly@yonder.uk",      phone: "+44 7700 900123", status: "Active" },
  { id: "C-026", companyName: "Zephyr Ltd",      contactPerson: "Owen Hale",   email: "owen@zephyr.co",       phone: "+353 85 123 4567", status: "Active" },
  { id: "C-027", companyName: "Artemis LLC",     contactPerson: "Mia Chen",    email: "mia@artemis.com",      phone: "+1 650 555 9988", status: "Active" },
  { id: "C-028", companyName: "Basil AG",        contactPerson: "Felix H",     email: "felix@basil.ch",       phone: "+41 79 123 45 67", status: "Active" },
  { id: "C-029", companyName: "Corex Inc.",      contactPerson: "Ravi Patel",  email: "ravi@corex.com",       phone: "+1 408 555 4321", status: "Active" },
  { id: "C-030", companyName: "Dorian SpA",      contactPerson: "Marco Rossi", email: "marco@dorian.it",      phone: "+39 347 123 4567", status: "Active" },
];

export type CostUnit = "per_sheet" | "per_packet" | "per_kg";

export interface MaterialRow {
  id: string;
  material: string;   // e.g. "Art Paper 300gsm"
  supplier: string;   // e.g. "Paper Source LLC"
  cost: number;       // numeric value, e.g. 0.5
  unit: CostUnit;     // "per_sheet" | "per_packet" | "per_kg"
  lastUpdated: string; // ISO date: "2025-07-22"
  status: "Active" | "Inactive"; // Active by default
}

export const materials: MaterialRow[] = [
  { id: "M-001", material: "Art Paper 300gsm", supplier: "Paper Source LLC", cost: 0.5, unit: "per_sheet", lastUpdated: "2025-07-22", status: "Active" },
  { id: "M-002", material: "Art Paper 150gsm", supplier: "Paper Source LLC", cost: 0.18, unit: "per_sheet", lastUpdated: "2025-07-20", status: "Active" },
  { id: "M-003", material: "Ivory 230gsm",     supplier: "Apex Papers",      cost: 0.27, unit: "per_sheet", lastUpdated: "2025-07-18", status: "Active" },
  { id: "M-004", material: "HVS 100gsm",        supplier: "Apex Papers",      cost: 3.2,  unit: "per_kg",    lastUpdated: "2025-07-18", status: "Active" },
  { id: "M-005", material: "Matte Lamination",  supplier: "Coat & Lam",       cost: 0.09, unit: "per_sheet", lastUpdated: "2025-07-15", status: "Active" },
  { id: "M-006", material: "Gloss Lamination",  supplier: "Coat & Lam",       cost: 0.08, unit: "per_sheet", lastUpdated: "2025-07-15", status: "Active" },
  { id: "M-007", material: "Foil Gold Roll",    supplier: "FoilCraft",        cost: 18,   unit: "per_kg",    lastUpdated: "2025-07-14", status: "Active" },
  { id: "M-008", material: "UV Spot Chemical",  supplier: "PrintChem",        cost: 12.5, unit: "per_kg",    lastUpdated: "2025-07-14", status: "Active" },
  { id: "M-009", material: "Die-Cut Blades",    supplier: "CutPro Tools",     cost: 45,   unit: "per_packet",lastUpdated: "2025-07-10", status: "Active" },
  { id: "M-010", material: "CTP Plate",         supplier: "PlateWorks",       cost: 3.9,  unit: "per_sheet", lastUpdated: "2025-07-09", status: "Active" },
  { id: "M-011", material: "Ink CMYK Set",      supplier: "Inkwell",          cost: 22,   unit: "per_kg",    lastUpdated: "2025-07-08", status: "Active" },
  { id: "M-012", material: "Binding Glue",      supplier: "BindCo",           cost: 7.5,  unit: "per_kg",    lastUpdated: "2025-07-06", status: "Active" },
];

export const unitLabel = (u: CostUnit) =>
  u === "per_sheet" ? "/ sheet" : u === "per_packet" ? "/ packet" : "/ kg";