"use client";

import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Home,
  ImageIcon,
  Landmark,
  LayoutDashboard,
  ListChecks,
  MinusCircle,
  Mic,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase/client";

type Screen =
  | "dashboard"
  | "incomes"
  | "expenses"
  | "accounts"
  | "debts"
  | "subscriptions"
  | "payments"
  | "agenda"
  | "pending"
  | "budget"
  | "home"
  | "botica"
  | "walkme"
  | "gina"
  | "maria"
  | "crisis"
  | "planb";

type Priority = "must_pay" | "important" | "negotiable" | "pause" | "eliminate";
type ExpenseFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly" | "bimonthly" | "quarterly" | "annual";
type ExpenseArea = "Casa" | "Personal Maria" | "Personal Gina" | "Compartido" | "Botica Spa" | "Walkme" | "Deuda" | "Suscripcion" | "Emergencia" | "Otro";
type Expense = {
  id: string;
  date: string;
  name: string;
  amount: number;
  type: ExpenseArea;
  category: string;
  priority: Priority;
  frequency: ExpenseFrequency;
  paidBy: string;
  due: string;
  business?: "Botica Spa" | "Walkme";
  paidPersonally?: boolean;
  notes?: string;
  attachmentName?: string;
  attachmentType?: "image" | "pdf";
  attachmentUrl?: string;
  attachmentFile?: File;
};
type IncomeArea = "Personal Maria" | "Personal Gina" | "Compartido" | "Botica Spa" | "Walkme" | "Prestamo" | "Apoyo familiar" | "Reembolso" | "Otro";
type Income = {
  id: string;
  date: string;
  source: string;
  type: IncomeArea;
  amount: number;
  account: string;
  method: string;
  notes: string;
  business?: "Botica Spa" | "Walkme";
  attachmentName?: string;
  attachmentType?: "image" | "pdf";
  attachmentUrl?: string;
  attachmentFile?: File;
};
type Account = {
  id: string;
  name: string;
  type: "Banco" | "Tarjeta credito" | "Tarjeta debito" | "Efectivo" | "Ahorros";
  owner: "Maria" | "Gina" | "Compartida" | "Botica Spa" | "Walkme";
  balance: number;
  debt: number;
  due: string;
  status: "Activa" | "Pendiente pago" | "Pagada" | "Critica" | "Ahorro";
  note: string;
};
type AppSettings = {
  id?: string;
  availableMoney: number;
  monthlySurvivalAmount: number;
  currency: string;
  emergencyStatus: string;
};
type ExpenseFilter = "Todos" | ExpenseArea;
type IncomeFilter = "Todos" | IncomeArea;
type BudgetKind = "fixed" | "variable";
type BudgetItem = {
  id: string;
  area: "Casa" | "Botica Spa" | "Walkme" | "Personal Gina" | "Personal Maria" | "Compartido";
  category: string;
  name: string;
  kind: BudgetKind;
  plannedAmount: number;
  notes: string;
};
type AgendaType = "payment" | "task" | "debt" | "subscription" | "reminder" | "sale" | "pending";
type AgendaArea = "home" | "maria" | "gina" | "shared" | "botica_spa" | "walkme";
type AgendaPriority = "urgent" | "must_pay" | "important" | "negotiable" | "pause" | "low";
type AgendaStatus = "pending" | "done" | "paid" | "overdue" | "negotiated" | "paused";
type AgendaAssignee = "Maria" | "Gina" | "Ambas";
type AgendaItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: AgendaType;
  area: AgendaArea;
  amount: number;
  priority: AgendaPriority;
  status: AgendaStatus;
  assignee: AgendaAssignee;
  source: "agenda" | "upcoming_payment";
  createdAt: string;
  updatedAt: string;
};

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

const defaultSettings: AppSettings = {
  availableMoney: 30000,
  monthlySurvivalAmount: 42000,
  currency: "MXN",
  emergencyStatus: "attention"
};

const authorizedUsers: Record<string, string> = {
  "9842590008": "Maria",
  "9841401005": "Gina"
};

const accessCodeHash = "ee78e630710019726506a5762a204876a71e300a2ec57da1445eb3644ca80bb1";

const initialAccounts: Account[] = [
  {
    id: "account-nu",
    name: "Cuenta NU",
    type: "Banco",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Activa",
    note: "Cuenta bancaria"
  },
  {
    id: "account-nu-card",
    name: "Tarjeta NU",
    type: "Tarjeta credito",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Pendiente pago",
    note: "Pago pendiente"
  },
  {
    id: "account-plata-card",
    name: "Plata Card",
    type: "Tarjeta credito",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Pendiente pago",
    note: "Pago pendiente"
  },
  {
    id: "account-banco-azteca",
    name: "Banco Azteca",
    type: "Banco",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Activa",
    note: "Cuenta de ingresos"
  },
  {
    id: "account-cash",
    name: "Efectivo",
    type: "Efectivo",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Activa",
    note: "Dinero disponible en efectivo"
  },
  {
    id: "account-savings",
    name: "Ahorros",
    type: "Ahorros",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Ahorro",
    note: "Ahorros disponibles"
  }
];

const initialIncomes: Income[] = [
  {
    id: "income-month-sales",
    date: "2026-05-01",
    source: "Ventas del mes",
    type: "Compartido",
    amount: 0,
    account: "Cuenta Maria",
    method: "Manual",
    notes: "Ingresos actuales en cero"
  }
];

const initialExpenses: Expense[] = [
  {
    id: "expense-home-rent",
    date: "2026-05-01",
    name: "Renta casa",
    amount: 14500,
    type: "Casa",
    category: "Renta",
    priority: "must_pay",
    frequency: "monthly",
    paidBy: "Compartido",
    due: "2026-05-03"
  },
  {
    id: "expense-home-groceries",
    date: "2026-05-01",
    name: "Supermercado minimo",
    amount: 5200,
    type: "Casa",
    category: "Comida",
    priority: "important",
    frequency: "weekly",
    paidBy: "Maria",
    due: "2026-05-05"
  },
  {
    id: "expense-botica-ads",
    date: "2026-05-01",
    name: "Publicidad Botica Spa",
    amount: 2800,
    type: "Botica Spa",
    category: "Publicidad",
    priority: "pause",
    frequency: "monthly",
    paidBy: "Maria",
    due: "2026-05-08",
    business: "Botica Spa",
    paidPersonally: true
  },
  {
    id: "expense-walkme-rent",
    date: "2026-05-01",
    name: "Renta Walkme",
    amount: 6000,
    type: "Walkme",
    category: "Renta local",
    priority: "must_pay",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-05",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-taxes",
    date: "2026-05-01",
    name: "Impuestos Walkme",
    amount: 7000,
    type: "Walkme",
    category: "Impuestos",
    priority: "must_pay",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-10",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-power",
    date: "2026-05-01",
    name: "Luz Walkme",
    amount: 1300,
    type: "Walkme",
    category: "Servicios",
    priority: "important",
    frequency: "bimonthly",
    paidBy: "Gina",
    due: "2026-05-08",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-telmex",
    date: "2026-05-01",
    name: "Telmex Walkme",
    amount: 700,
    type: "Walkme",
    category: "Servicios",
    priority: "important",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-08",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-municipio",
    date: "2026-05-01",
    name: "Municipio 1.20 Walkme",
    amount: 2500,
    type: "Walkme",
    category: "Municipio",
    priority: "negotiable",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-12",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-trino",
    date: "2026-05-01",
    name: "Trino Walkme",
    amount: 1750,
    type: "Walkme",
    category: "Proveedor",
    priority: "negotiable",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-12",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-payroll-tax",
    date: "2026-05-01",
    name: "4% nomina Walkme",
    amount: 700,
    type: "Walkme",
    category: "Nomina",
    priority: "must_pay",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-15",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-walkme-atocha",
    date: "2026-05-01",
    name: "Atocha Walkme",
    amount: 500,
    type: "Walkme",
    category: "Proveedor",
    priority: "negotiable",
    frequency: "monthly",
    paidBy: "Gina",
    due: "2026-05-15",
    business: "Walkme",
    paidPersonally: true
  },
  {
    id: "expense-shared-apps",
    date: "2026-05-01",
    name: "Apps no esenciales",
    amount: 1200,
    type: "Compartido",
    category: "Apps",
    priority: "eliminate",
    frequency: "monthly",
    paidBy: "Tarjeta Gina",
    due: "2026-05-10"
  }
];

const initialBudgets: BudgetItem[] = [
  {
    id: "budget-home-rent",
    area: "Casa",
    category: "Renta",
    name: "Renta casa",
    kind: "fixed",
    plannedAmount: 14500,
    notes: "Pago fijo mensual"
  },
  {
    id: "budget-home-groceries",
    area: "Casa",
    category: "Comida",
    name: "Super y comida",
    kind: "variable",
    plannedAmount: 8000,
    notes: "Estimado inicial; ajustar con tickets reales"
  },
  {
    id: "budget-home-utilities",
    area: "Casa",
    category: "Servicios",
    name: "Luz, agua, internet",
    kind: "fixed",
    plannedAmount: 2800,
    notes: "Estimado hasta capturar recibos reales"
  },
  {
    id: "budget-botica-ads",
    area: "Botica Spa",
    category: "Publicidad",
    name: "Publicidad Botica Spa",
    kind: "variable",
    plannedAmount: 2800,
    notes: "Pausable si no hay ventas"
  },
  {
    id: "budget-walkme-rent",
    area: "Walkme",
    category: "Renta local",
    name: "Renta Walkme",
    kind: "fixed",
    plannedAmount: 6000,
    notes: "Gasto fijo del negocio"
  },
  {
    id: "budget-walkme-taxes",
    area: "Walkme",
    category: "Impuestos",
    name: "Impuestos Walkme",
    kind: "fixed",
    plannedAmount: 7000,
    notes: "Revisar contra pago real"
  },
  {
    id: "budget-walkme-services",
    area: "Walkme",
    category: "Servicios",
    name: "Luz y Telmex Walkme",
    kind: "fixed",
    plannedAmount: 2000,
    notes: "Estimado con luz y Telmex"
  }
];

const debts = [
  {
    name: "Tarjeta Gina",
    creditor: "Banco",
    total: 7800,
    minimum: 1900,
    due: "2026-05-06",
    priority: "Pagar si o si",
    status: "Pendiente"
  },
  {
    name: "Proveedor Walkme",
    creditor: "Proveedor",
    total: 4200,
    minimum: 4200,
    due: "2026-04-29",
    priority: "Negociar",
    status: "Atrasada"
  }
];

const subscriptions = [
  {
    name: "Herramienta IA",
    amount: 600,
    billing: "2026-05-04",
    type: "Botica Spa",
    category: "IA",
    priority: "Pausar",
    account: "Tarjeta Gina",
    status: "Activa"
  },
  {
    name: "Streaming",
    amount: 299,
    billing: "2026-05-06",
    type: "Casa",
    category: "TV / Streaming",
    priority: "Cancelar",
    account: "Tarjeta Gina",
    status: "Activa"
  },
  {
    name: "Dominio Walkme",
    amount: 450,
    billing: "2026-05-14",
    type: "Walkme",
    category: "Hosting / Dominio",
    priority: "Necesaria",
    account: "Cuenta Maria",
    status: "Activa"
  }
];

const upcomingPayments = [
  {
    name: "Renta casa",
    amount: 14500,
    due: "2026-05-03",
    group: "Hoy",
    type: "Casa",
    priority: "Pagar si o si",
    status: "Pendiente"
  },
  {
    name: "Tarjeta Gina",
    amount: 1900,
    due: "2026-05-06",
    group: "Esta semana",
    type: "Tarjeta",
    priority: "Pagar si o si",
    status: "Pendiente"
  },
  {
    name: "Proveedor Walkme",
    amount: 4200,
    due: "2026-04-29",
    group: "Atrasados",
    type: "Deuda",
    priority: "Negociar",
    status: "Atrasado"
  },
  {
    name: "Dominio Walkme",
    amount: 450,
    due: "2026-05-14",
    group: "Este mes",
    type: "Walkme",
    priority: "Importante",
    status: "Pendiente"
  }
];

const initialAgendaItems: AgendaItem[] = [
  {
    id: "agenda-negotiate-walkme-provider",
    title: "Negociar proveedor Walkme",
    description: "Pedir prorroga y registrar respuesta.",
    date: "2026-05-01",
    time: "12:30",
    type: "pending",
    area: "walkme",
    amount: 4200,
    priority: "urgent",
    status: "pending",
    assignee: "Gina",
    source: "agenda",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01"
  },
  {
    id: "agenda-cancel-streaming",
    title: "Cancelar streaming",
    description: "Marcar suscripcion como cancelada antes del cobro.",
    date: "2026-05-01",
    time: "18:00",
    type: "subscription",
    area: "home",
    amount: 299,
    priority: "important",
    status: "pending",
    assignee: "Maria",
    source: "agenda",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01"
  },
  {
    id: "agenda-botica-promo",
    title: "Publicar promocion Botica Spa",
    description: "Publicar oferta y anotar mensajes recibidos.",
    date: "2026-05-02",
    time: "09:00",
    type: "sale",
    area: "botica_spa",
    amount: 0,
    priority: "important",
    status: "pending",
    assignee: "Maria",
    source: "agenda",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01"
  },
  {
    id: "agenda-contact-botica-clients",
    title: "Contactar clientas de Botica",
    description: "Enviar WhatsApp a 10 clientas.",
    date: "2026-05-02",
    time: "11:00",
    type: "sale",
    area: "botica_spa",
    amount: 0,
    priority: "important",
    status: "pending",
    assignee: "Maria",
    source: "agenda",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01"
  }
];

const followUps = [
  {
    name: "Clientas Botica Spa",
    area: "Botica Spa",
    owner: "Maria",
    status: "Contactar hoy",
    value: "Meta: 10 mensajes",
    next: "Hoy"
  },
  {
    name: "Proveedor Walkme",
    area: "Walkme",
    owner: "Gina",
    status: "Esperando respuesta",
    value: "$4,200",
    next: "Hoy"
  },
  {
    name: "Renta local Walkme",
    area: "Walkme",
    owner: "Ambas",
    status: "Reagendar",
    value: "$6,000",
    next: "Esta semana"
  },
  {
    name: "Promocion Botica Spa",
    area: "Ventas",
    owner: "Maria",
    status: "En proceso",
    value: "Meta: $3,000",
    next: "Sabado"
  }
];

const navItems = [
  { id: "home" as Screen, label: "Casa", icon: Home },
  { id: "walkme" as Screen, label: "Walkme", icon: Store },
  { id: "botica" as Screen, label: "Botica", icon: Sparkles },
  { id: "gina" as Screen, label: "Gina", icon: UserRound },
  { id: "maria" as Screen, label: "Maria", icon: UserRound }
];

const quickActions = [
  { id: "incomes" as Screen, label: "Agregar ingreso", icon: ArrowUpCircle },
  { id: "expenses" as Screen, label: "Agregar gasto", icon: ArrowDownCircle },
  { id: "accounts" as Screen, label: "Agregar cuenta", icon: Wallet },
  { id: "debts" as Screen, label: "Agregar deuda", icon: Landmark },
  { id: "subscriptions" as Screen, label: "Agregar suscripcion", icon: Bell },
  { id: "payments" as Screen, label: "Agregar pago proximo", icon: CalendarClock },
  { id: "budget" as Screen, label: "Agregar presupuesto", icon: PiggyBank },
  { id: "agenda" as Screen, label: "Agregar actividad", icon: CalendarDays },
  { id: "pending" as Screen, label: "Agregar pendiente", icon: ClipboardList }
];

function calcDays(amount: number, monthly: number) {
  return Math.max(0, Math.floor(amount / (monthly / 30)));
}

function priorityLabel(priority: Priority) {
  const labels: Record<Priority, string> = {
    must_pay: "Pagar si o si",
    important: "Importante",
    negotiable: "Negociable",
    pause: "Pausar",
    eliminate: "Eliminar"
  };
  return labels[priority];
}

function frequencyLabel(frequency: ExpenseFrequency) {
  const labels: Record<ExpenseFrequency, string> = {
    once: "Una sola vez",
    daily: "Diario",
    weekly: "Semanal",
    biweekly: "Quincenal",
    monthly: "Mensual",
    bimonthly: "Bimestral",
    quarterly: "Trimestral",
    annual: "Anual"
  };
  return labels[frequency];
}

const expenseFrequencies: ExpenseFrequency[] = ["once", "daily", "weekly", "biweekly", "monthly", "bimonthly", "quarterly", "annual"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function incomeTypeForArea(area: "Casa" | "Botica Spa" | "Walkme" | "Personal Gina" | "Personal Maria"): IncomeArea {
  if (area === "Botica Spa" || area === "Walkme" || area === "Personal Gina" || area === "Personal Maria") return area;
  return "Compartido";
}

function readStoredList<T>(key: string, fallback: T[]) {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function readStoredValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeById<T extends { id: string }>(localItems: T[], remoteItems: T[]) {
  const map = new Map<string, T>();
  localItems.forEach((item) => map.set(item.id, item));
  remoteItems.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

const accountOptions = initialAccounts.map((account) => ({ name: account.name }));

function newRecordId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function receiptKind(file: File) {
  if (file.type === "application/pdf") return "pdf" as const;
  return "image" as const;
}

async function uploadReceipt(file: File | undefined, folder: "incomes" | "expenses") {
  if (!file) return undefined;
  if (!supabase) return undefined;
  const extension = file.name.split(".").pop() || "file";
  const path = `${folder}/${newRecordId()}.${extension}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
  if (error) {
    console.warn("Receipt upload failed", error.message);
    return undefined;
  }
  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl || path;
}

function incomeFromRow(row: Record<string, unknown>): Income {
  const type = String(row.type ?? "Compartido") as IncomeArea;
  const attachment = typeof row.attachment_path === "string" && row.attachment_path.length > 0 ? row.attachment_path : undefined;
  return {
    id: String(row.id),
    date: String(row.date ?? "2026-05-01"),
    source: String(row.source ?? ""),
    type,
    amount: Number(row.amount ?? 0),
    account: "Cuenta Maria",
    method: String(row.payment_method ?? "Manual"),
    notes: String(row.notes ?? ""),
    business: type === "Botica Spa" || type === "Walkme" ? type : undefined,
    attachmentName: attachment ? "Comprobante guardado" : undefined,
    attachmentType: attachment?.toLowerCase().includes(".pdf") ? "pdf" : attachment ? "image" : undefined,
    attachmentUrl: attachment
  };
}

function expenseFromRow(row: Record<string, unknown>): Expense {
  const type = String(row.type ?? "Casa") as ExpenseArea;
  const attachment = typeof row.attachment_path === "string" && row.attachment_path.length > 0 ? row.attachment_path : undefined;
  return {
    id: String(row.id),
    date: String(row.date ?? "2026-05-01"),
    name: String(row.name ?? ""),
    amount: Number(row.amount ?? 0),
    type,
    category: String(row.category ?? "Sin categoria"),
    priority: String(row.priority ?? "important") as Priority,
    frequency: String(row.frequency ?? (row.is_recurring ? "monthly" : "once")) as ExpenseFrequency,
    paidBy: String(row.paid_by_label ?? "Compartido"),
    due: String(row.due_date ?? row.date ?? "2026-05-01"),
    business: type === "Botica Spa" || type === "Walkme" ? type : undefined,
    paidPersonally: Boolean(row.is_business_expense_paid_personally),
    notes: String(row.notes ?? ""),
    attachmentName: attachment ? "Comprobante guardado" : undefined,
    attachmentType: attachment?.toLowerCase().includes(".pdf") ? "pdf" : attachment ? "image" : undefined,
    attachmentUrl: attachment
  };
}

function budgetFromRow(row: Record<string, unknown>): BudgetItem {
  return {
    id: String(row.id),
    area: String(row.area ?? "Casa") as BudgetItem["area"],
    category: String(row.category ?? "Sin categoria"),
    name: String(row.name ?? ""),
    kind: String(row.kind ?? "variable") as BudgetKind,
    plannedAmount: Number(row.planned_amount ?? 0),
    notes: String(row.notes ?? "")
  };
}

function agendaFromRow(row: Record<string, unknown>): AgendaItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    date: String(row.date ?? "2026-05-01"),
    time: String(row.time ?? "09:00").slice(0, 5),
    type: String(row.type ?? "pending") as AgendaType,
    area: String(row.area ?? "shared") as AgendaArea,
    amount: Number(row.amount ?? 0),
    priority: String(row.priority ?? "important") as AgendaPriority,
    status: String(row.status ?? "pending") as AgendaStatus,
    assignee: String(row.assignee ?? "Ambas") as AgendaAssignee,
    source: "agenda",
    createdAt: String(row.created_at ?? "2026-05-01"),
    updatedAt: String(row.updated_at ?? "2026-05-01")
  };
}

function AppShell() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [quickOpen, setQuickOpen] = useState(false);
  const [incomes, setIncomes] = useState<Income[]>(() => readStoredList("control30-incomes", initialIncomes));
  const [expenses, setExpenses] = useState<Expense[]>(() => readStoredList("control30-expenses", initialExpenses));
  const [budgets, setBudgets] = useState<BudgetItem[]>(() => readStoredList("control30-budgets", initialBudgets));
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => readStoredList("control30-agenda", initialAgendaItems));
  const [appSettings, setAppSettings] = useState<AppSettings>(() => readStoredValue("control30-settings", defaultSettings));
  const [syncStatus, setSyncStatus] = useState("Conectando con Supabase...");

  useEffect(() => {
    setCurrentUser(window.localStorage.getItem("control30-user"));
    setAuthReady(true);
  }, []);

  useEffect(() => {
    writeStoredList("control30-budgets", budgets);
  }, [budgets]);

  useEffect(() => {
    writeStoredList("control30-incomes", incomes);
  }, [incomes]);

  useEffect(() => {
    writeStoredList("control30-expenses", expenses);
  }, [expenses]);

  useEffect(() => {
    writeStoredList("control30-agenda", agendaItems);
  }, [agendaItems]);

  useEffect(() => {
    writeStoredValue("control30-settings", appSettings);
  }, [appSettings]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [screen]);

  useEffect(() => {
    let active = true;

    async function loadRealData() {
      if (!isSupabaseConfigured || !supabase) {
        setSyncStatus("Vercel necesita variables de Supabase. Mientras tanto la app guarda en este dispositivo.");
        return;
      }

      try {
        const [settingsResponse, incomesResponse, expensesResponse, budgetsResponse, agendaResponse] = await Promise.all([
          supabase.from("settings").select("*").limit(1).maybeSingle(),
          supabase.from("incomes").select("*").gte("date", "2026-05-01").order("date", { ascending: false }),
          supabase.from("expenses").select("*").gte("date", "2026-05-01").order("date", { ascending: false }),
          supabase.from("budget_items").select("*").order("created_at", { ascending: true }),
          supabase.from("agenda_items").select("*").gte("date", "2026-05-01").order("date", { ascending: true })
        ]);

        if (!active) return;

        if (settingsResponse.data) {
          const remoteSettings = {
            id: settingsResponse.data.id,
            availableMoney: Number(settingsResponse.data.available_money ?? defaultSettings.availableMoney),
            monthlySurvivalAmount: Number(settingsResponse.data.monthly_survival_amount ?? defaultSettings.monthlySurvivalAmount),
            currency: String(settingsResponse.data.currency ?? "MXN"),
            emergencyStatus: String(settingsResponse.data.emergency_status ?? "attention")
          };
          setAppSettings((current) => (current.id ? current : remoteSettings));
        }

        if (incomesResponse.data && incomesResponse.data.length > 0) {
          const remote = incomesResponse.data.map((row) => incomeFromRow(row));
          setIncomes((current) => mergeById(current, remote));
        }
        if (expensesResponse.data && expensesResponse.data.length > 0) {
          const remote = expensesResponse.data.map((row) => expenseFromRow(row));
          setExpenses((current) => mergeById(current, remote));
        }
        if (budgetsResponse.data && budgetsResponse.data.length > 0) {
          const remote = budgetsResponse.data.map((row) => budgetFromRow(row));
          setBudgets((current) => mergeById(current, remote));
        }
        if (agendaResponse.data && agendaResponse.data.length > 0) {
          const remote = agendaResponse.data.map((row) => agendaFromRow(row));
          setAgendaItems((current) => mergeById(current, remote));
        }

        const firstError = settingsResponse.error ?? incomesResponse.error ?? expensesResponse.error ?? budgetsResponse.error ?? agendaResponse.error;
        setSyncStatus(firstError ? "Supabase necesita el SQL de tablas. Mientras tanto ves datos base." : "Guardado real activo desde el 1 de mayo.");
      } catch {
        if (active) {
          setSyncStatus("No pude cargar Supabase. Puedes ver la app, pero revisa que el SQL este corrido.");
        }
      }
    }

    void loadRealData();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const monthIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const monthExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const shortfall = Math.max(0, appSettings.monthlySurvivalAmount - appSettings.availableMoney);
    const survivalDays = calcDays(appSettings.availableMoney, appSettings.monthlySurvivalAmount);
    const personalBusiness = expenses
      .filter((item) => item.paidPersonally)
      .reduce((sum, item) => sum + item.amount, 0);
    const boticaExpenses = expenses
      .filter((item) => item.business === "Botica Spa")
      .reduce((sum, item) => sum + item.amount, 0);
    const walkmeExpenses = expenses
      .filter((item) => item.business === "Walkme")
      .reduce((sum, item) => sum + item.amount, 0);
    const homeExpenses = expenses
      .filter((item) => item.type === "Casa")
      .reduce((sum, item) => sum + item.amount, 0);
    const ginaExpenses = expenses
      .filter((item) => item.type === "Personal Gina")
      .reduce((sum, item) => sum + item.amount, 0);
    const mariaExpenses = expenses
      .filter((item) => item.type === "Personal Maria")
      .reduce((sum, item) => sum + item.amount, 0);
    const boticaIncome = incomes
      .filter((item) => item.business === "Botica Spa")
      .reduce((sum, item) => sum + item.amount, 0);
    const walkmeIncome = incomes
      .filter((item) => item.business === "Walkme")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      monthIncome,
      monthExpenses,
      balance: monthIncome - monthExpenses,
      shortfall,
      survivalDays,
      personalBusiness,
      boticaExpenses,
      walkmeExpenses,
      homeExpenses,
      ginaExpenses,
      mariaExpenses,
      boticaIncome,
      walkmeIncome,
      weeklySalesGoal: Math.ceil(shortfall / 4),
      drainingBusiness: walkmeExpenses >= boticaExpenses ? "Walkme" : "Botica Spa"
    };
  }, [appSettings, expenses, incomes]);

  async function saveSettings(next: AppSettings) {
    setAppSettings(next);
    if (!supabase) {
      setSyncStatus("Configuracion guardada en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    const payload = {
      available_money: next.availableMoney,
      monthly_survival_amount: next.monthlySurvivalAmount,
      currency: next.currency,
      emergency_status: next.emergencyStatus,
      updated_at: new Date().toISOString()
    };
    const request = next.id ? supabase.from("settings").update(payload).eq("id", next.id).select().single() : supabase.from("settings").insert(payload).select().single();
    const { data, error } = await request;
    if (error) {
      setSyncStatus(`No se guardo configuracion: ${error.message}`);
      return;
    }
    setAppSettings({
      id: data.id,
      availableMoney: Number(data.available_money),
      monthlySurvivalAmount: Number(data.monthly_survival_amount),
      currency: String(data.currency),
      emergencyStatus: String(data.emergency_status)
    });
    setSyncStatus("Datos base guardados en Supabase.");
  }

  async function saveIncomeRecord(income: Income) {
    setIncomes((current) => {
      const exists = current.some((item) => item.id === income.id);
      return exists ? current.map((item) => (item.id === income.id ? income : item)) : [income, ...current];
    });
    const attachmentUrl = (await uploadReceipt(income.attachmentFile, "incomes")) ?? income.attachmentUrl;
    if (!supabase) {
      setSyncStatus("Ingreso guardado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    const payload = {
      ...(isUuid(income.id) ? { id: income.id } : {}),
      date: income.date,
      amount: income.amount,
      source: income.source,
      type: income.type,
      payment_method: income.method,
      attachment_path: attachmentUrl ?? null,
      notes: income.notes,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("incomes").upsert(payload).select().single();
    if (error) {
      setSyncStatus(`Ingreso guardado en este dispositivo. Supabase dijo: ${error.message}`);
      return;
    }
    const saved = incomeFromRow(data);
    setIncomes((current) => {
      const exists = current.some((item) => item.id === income.id || item.id === saved.id);
      return exists ? current.map((item) => (item.id === income.id || item.id === saved.id ? saved : item)) : [saved, ...current];
    });
    setSyncStatus("Ingreso guardado en Supabase.");
  }

  async function deleteIncomeRecord(id: string) {
    setIncomes((current) => current.filter((item) => item.id !== id));
    if (!supabase) {
      setSyncStatus("Ingreso borrado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    if (isUuid(id)) {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      setSyncStatus(error ? `Ingreso borrado en este dispositivo. Supabase dijo: ${error.message}` : "Ingreso borrado.");
    } else {
      setSyncStatus("Ingreso borrado en este dispositivo.");
    }
  }

  async function saveExpenseRecord(expense: Expense) {
    setExpenses((current) => {
      const exists = current.some((item) => item.id === expense.id);
      return exists ? current.map((item) => (item.id === expense.id ? expense : item)) : [expense, ...current];
    });
    const attachmentUrl = (await uploadReceipt(expense.attachmentFile, "expenses")) ?? expense.attachmentUrl;
    if (!supabase) {
      setSyncStatus("Gasto guardado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    const payload = {
      ...(isUuid(expense.id) ? { id: expense.id } : {}),
      date: expense.date,
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      category: expense.category,
      priority: expense.priority,
      frequency: expense.frequency,
      paid_by_label: expense.paidBy,
      due_date: expense.due,
      is_recurring: expense.frequency !== "once",
      is_business_expense_paid_personally: Boolean(expense.paidPersonally),
      attachment_path: attachmentUrl ?? null,
      notes: expense.notes ?? "",
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("expenses").upsert(payload).select().single();
    if (error) {
      setSyncStatus(`Gasto guardado en este dispositivo. Supabase dijo: ${error.message}`);
      return;
    }
    const saved = expenseFromRow(data);
    setExpenses((current) => {
      const exists = current.some((item) => item.id === expense.id || item.id === saved.id);
      return exists ? current.map((item) => (item.id === expense.id || item.id === saved.id ? saved : item)) : [saved, ...current];
    });
    setSyncStatus("Gasto guardado en Supabase.");
  }

  async function deleteExpenseRecord(id: string) {
    setExpenses((current) => current.filter((item) => item.id !== id));
    if (!supabase) {
      setSyncStatus("Gasto borrado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    if (isUuid(id)) {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      setSyncStatus(error ? `Gasto borrado en este dispositivo. Supabase dijo: ${error.message}` : "Gasto borrado.");
    } else {
      setSyncStatus("Gasto borrado en este dispositivo.");
    }
  }

  async function saveBudgetRecord(budget: BudgetItem) {
    setBudgets((current) => {
      const exists = current.some((item) => item.id === budget.id);
      return exists ? current.map((item) => (item.id === budget.id ? budget : item)) : [budget, ...current];
    });
    if (!supabase) {
      setSyncStatus("Presupuesto guardado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    const payload = {
      ...(isUuid(budget.id) ? { id: budget.id } : {}),
      area: budget.area,
      category: budget.category,
      name: budget.name,
      kind: budget.kind,
      planned_amount: budget.plannedAmount,
      notes: budget.notes,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("budget_items").upsert(payload).select().single();
    if (error) {
      setSyncStatus(`Presupuesto guardado en este dispositivo. Supabase dijo: ${error.message}`);
      return;
    }
    const saved = budgetFromRow(data);
    setBudgets((current) => {
      const exists = current.some((item) => item.id === budget.id || item.id === saved.id);
      return exists ? current.map((item) => (item.id === budget.id || item.id === saved.id ? saved : item)) : [saved, ...current];
    });
    setSyncStatus("Presupuesto guardado en Supabase.");
  }

  async function deleteBudgetRecord(id: string) {
    setBudgets((current) => current.filter((item) => item.id !== id));
    if (!supabase) {
      setSyncStatus("Presupuesto borrado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    if (isUuid(id)) {
      const { error } = await supabase.from("budget_items").delete().eq("id", id);
      setSyncStatus(error ? `Presupuesto borrado en este dispositivo. Supabase dijo: ${error.message}` : "Presupuesto borrado.");
    } else {
      setSyncStatus("Presupuesto borrado en este dispositivo.");
    }
  }

  async function saveAgendaRecord(item: AgendaItem) {
    setAgendaItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...current];
    });
    if (!supabase) {
      setSyncStatus("Pendiente guardado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    const payload = {
      ...(isUuid(item.id) ? { id: item.id } : {}),
      title: item.title,
      description: item.description,
      date: item.date,
      time: item.time,
      type: item.type,
      area: item.area,
      amount: item.amount,
      priority: item.priority,
      status: item.status,
      assignee: item.assignee,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("agenda_items").upsert(payload).select().single();
    if (error) {
      setSyncStatus(`Pendiente guardado en este dispositivo. Supabase dijo: ${error.message}`);
      return;
    }
    const saved = agendaFromRow(data);
    setAgendaItems((current) => {
      const exists = current.some((entry) => entry.id === item.id || entry.id === saved.id);
      return exists ? current.map((entry) => (entry.id === item.id || entry.id === saved.id ? saved : entry)) : [saved, ...current];
    });
    setSyncStatus("Pendiente guardado en Supabase.");
  }

  async function updateAgendaStatus(id: string, status: AgendaStatus) {
    setAgendaItems((current) => current.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item)));
    if (!supabase) {
      setSyncStatus("Pendiente actualizado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    if (isUuid(id)) {
      const { error } = await supabase.from("agenda_items").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      setSyncStatus(error ? `Pendiente actualizado en este dispositivo. Supabase dijo: ${error.message}` : "Pendiente actualizado.");
    } else {
      setSyncStatus("Pendiente actualizado en este dispositivo.");
    }
  }

  async function deleteAgendaRecord(id: string) {
    setAgendaItems((current) => current.filter((item) => item.id !== id));
    if (!supabase) {
      setSyncStatus("Pendiente borrado en este dispositivo. Falta configurar Supabase en Vercel.");
      return;
    }
    if (isUuid(id)) {
      const { error } = await supabase.from("agenda_items").delete().eq("id", id);
      setSyncStatus(error ? `Pendiente borrado en este dispositivo. Supabase dijo: ${error.message}` : "Pendiente borrado.");
    } else {
      setSyncStatus("Pendiente borrado en este dispositivo.");
    }
  }

  function login(user: string) {
    window.localStorage.setItem("control30-user", user);
    setCurrentUser(user);
  }

  function logout() {
    window.localStorage.removeItem("control30-user");
    setCurrentUser(null);
  }

  if (!authReady) {
    return <main className="min-h-screen bg-calm" />;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-calm text-ink lg:flex">
      <aside className="hidden w-72 shrink-0 border-r border-green-900/10 bg-white px-5 py-6 lg:block">
        <div className="mb-7">
          <p className="text-sm font-semibold text-slate-500">Control 30</p>
          <p className="mt-1 text-2xl font-bold">Familia Agassl</p>
        </div>
        <div className="space-y-2">
          <button
            className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-semibold ${
              screen === "dashboard" ? "bg-ink text-white" : "text-slate-600 hover:bg-green-50"
            }`}
            onClick={() => setScreen("dashboard")}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-semibold ${
                screen === item.id ? "bg-ink text-white" : "text-slate-600 hover:bg-green-50"
              }`}
              onClick={() => setScreen(item.id)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
        <button
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 font-semibold text-white"
          onClick={() => setQuickOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Agregar
        </button>
        <button
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-olive px-4 font-semibold text-white"
          onClick={() => setScreen("planb")}
        >
          <BriefcaseBusiness className="h-5 w-5" />
          Plan familiar
        </button>
        <button
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-100 px-4 font-semibold text-slate-700"
          onClick={logout}
        >
          Salir
        </button>
      </aside>

      <div className="min-w-0 flex-1 pb-28 lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-green-900/10 bg-calm/95 px-5 pb-3 pt-5 backdrop-blur lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Control 30</p>
            <h1 className="text-2xl font-bold tracking-normal lg:text-3xl">{titleFor(screen)}</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">Sesion: {currentUser}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="hidden min-h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm lg:block"
              onClick={logout}
            >
              Salir
            </button>
            <button
              className="app-touch flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
              onClick={() => setScreen("dashboard")}
              aria-label="Abrir Dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
            <button
              className="app-touch flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
              onClick={() => setScreen("planb")}
              aria-label="Abrir Plan B"
            >
              <BriefcaseBusiness className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-full px-4 py-5 sm:px-5 lg:max-w-6xl lg:px-8 lg:py-7">
        {screen === "dashboard" && <Dashboard totals={totals} settings={appSettings} syncStatus={syncStatus} onSaveSettings={(next) => void saveSettings(next)} setScreen={setScreen} />}
        {screen === "incomes" && <IncomeScreen incomes={incomes} onSaveIncome={(income) => void saveIncomeRecord(income)} onDeleteIncome={(id) => void deleteIncomeRecord(id)} />}
        {screen === "expenses" && <ExpenseScreen expenses={expenses} onSaveExpense={(expense) => void saveExpenseRecord(expense)} onDeleteExpense={(id) => void deleteExpenseRecord(id)} />}
        {screen === "budget" && <BudgetScreen budgets={budgets} onSaveBudget={(budget) => void saveBudgetRecord(budget)} onDeleteBudget={(id) => void deleteBudgetRecord(id)} expenses={expenses} setScreen={setScreen} />}
        {screen === "accounts" && <AccountsScreen />}
        {screen === "debts" && <DebtsScreen />}
        {screen === "subscriptions" && <SubscriptionsScreen />}
        {screen === "payments" && <PaymentsScreen />}
        {screen === "agenda" && <AgendaScreen storedItems={agendaItems} onSaveItem={(item) => void saveAgendaRecord(item)} onUpdateStatus={(id, status) => void updateAgendaStatus(id, status)} onDeleteItem={(id) => void deleteAgendaRecord(id)} />}
        {screen === "pending" && <PendingScreen items={agendaItems} onSaveItem={(item) => void saveAgendaRecord(item)} onUpdateStatus={(id, status) => void updateAgendaStatus(id, status)} onDeleteItem={(id) => void deleteAgendaRecord(id)} />}
        {screen === "home" && <AreaDetailScreen area="Casa" expenses={expenses} incomes={incomes} budgets={budgets} onSaveExpense={(expense) => void saveExpenseRecord(expense)} onSaveIncome={(income) => void saveIncomeRecord(income)} setScreen={setScreen} />}
        {screen === "botica" && <AreaDetailScreen area="Botica Spa" expenses={expenses} incomes={incomes} budgets={budgets} onSaveExpense={(expense) => void saveExpenseRecord(expense)} onSaveIncome={(income) => void saveIncomeRecord(income)} setScreen={setScreen} />}
        {screen === "walkme" && <AreaDetailScreen area="Walkme" expenses={expenses} incomes={incomes} budgets={budgets} onSaveExpense={(expense) => void saveExpenseRecord(expense)} onSaveIncome={(income) => void saveIncomeRecord(income)} setScreen={setScreen} />}
        {screen === "gina" && <AreaDetailScreen area="Personal Gina" expenses={expenses} incomes={incomes} budgets={budgets} onSaveExpense={(expense) => void saveExpenseRecord(expense)} onSaveIncome={(income) => void saveIncomeRecord(income)} setScreen={setScreen} />}
        {screen === "maria" && <AreaDetailScreen area="Personal Maria" expenses={expenses} incomes={incomes} budgets={budgets} onSaveExpense={(expense) => void saveExpenseRecord(expense)} onSaveIncome={(income) => void saveIncomeRecord(income)} setScreen={setScreen} />}
        {screen === "crisis" && <CrisisScreen totals={totals} setScreen={setScreen} />}
        {screen === "planb" && <PlanBScreen totals={totals} settings={appSettings} />}
      </section>

      {quickOpen && (
        <div className="fixed inset-0 z-30 bg-ink/30 px-5 pb-28 pt-20 lg:flex lg:items-start lg:justify-center" onClick={() => setQuickOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-3 shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="font-semibold">Agregar rapido</p>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                onClick={() => setQuickOpen(false)}
                aria-label="Cerrar acciones"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 text-left active:bg-slate-50"
                  onClick={() => {
                    setScreen(action.id);
                    setQuickOpen(false);
                  }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white shadow-soft lg:hidden"
        onClick={() => setQuickOpen(true)}
        aria-label="Agregar"
      >
        <Plus className="h-7 w-7" />
      </button>

      <nav className="app-bottom-safe fixed inset-x-0 bottom-0 z-30 grid w-full grid-cols-5 border-t border-slate-200 bg-white px-2 pt-2 lg:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${
              screen === item.id ? "bg-slate-100 text-ink" : "text-slate-500"
            }`}
            onClick={() => setScreen(item.id)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
      </div>
    </main>
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function LoginScreen({ onLogin }: { onLogin: (user: string) => void }) {
  const [phone, setPhone] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    const normalizedPhone = phone.replace(/\D/g, "");
    const user = authorizedUsers[normalizedPhone];
    const codeHash = await sha256(accessCode);

    if (!user || codeHash !== accessCodeHash) {
      setError("Celular o clave incorrectos.");
      return;
    }

    onLogin(user);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-calm px-5 py-10 text-ink">
      <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold text-slate-500">Control 30</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">Finanzas familiares</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Acceso privado para Maria y Gina.</p>

        <div className="mt-6 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-600">Celular</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="10 digitos"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-600">Clave</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Clave privada"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submit();
                }
              }}
            />
          </label>
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-emergency">{error}</p> : null}
          <button className="min-h-12 rounded-xl bg-ink px-4 font-semibold text-white" onClick={() => void submit()}>
            Entrar
          </button>
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  totals,
  settings,
  syncStatus,
  onSaveSettings,
  setScreen
}: {
  totals: ReturnType<typeof useTotalsShape>;
  settings: AppSettings;
  syncStatus: string;
  onSaveSettings: (settings: AppSettings) => void;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-4">
      <StatusHero
        title="Estado de atencion"
        message={`Con ${money.format(settings.availableMoney)} disponibles, faltan ${money.format(
          totals.shortfall
        )} para cubrir el mes.`}
        value={money.format(settings.availableMoney)}
        subvalue={`${totals.survivalDays} dias estimados de cobertura`}
      />

      <SettingsQuickCard settings={settings} syncStatus={syncStatus} onSave={onSaveSettings} />

      <div className="grid gap-3 lg:grid-cols-2">
        <AreaButton label="Dinero actual" value="NU, Plata Card, Banco Azteca, efectivo y ahorros" icon={Wallet} onClick={() => setScreen("accounts")} />
        <AreaButton label="Solo ingresos" value="Registrar entradas del dia, semana o mes" icon={ArrowUpCircle} onClick={() => setScreen("incomes")} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Minimo mensual" value={money.format(settings.monthlySurvivalAmount)} />
        <MetricCard label="Ingresos del mes" value={money.format(totals.monthIncome)} />
        <MetricCard label="Egresos del mes" value={money.format(totals.monthExpenses)} />
        <MetricCard label="Balance real" value={money.format(totals.balance)} tone="red" />
      </div>

      <CalmNotice text={`Meta minima de ventas semanal: ${money.format(totals.weeklySalesGoal)}.`} />

      <SectionTitle title="Hoy" action="Ver agenda" onClick={() => setScreen("agenda")} />
      <div className="grid gap-3 lg:grid-cols-2">
        <InsightRow icon={Clock3} label="Pendientes de hoy" value="3 actividades" tone="yellow" />
        <InsightRow icon={ClipboardList} label="Seguimientos abiertos" value="4 seguimientos" />
      </div>

      <SectionTitle title="Pendientes por area" action="Ver pendientes" onClick={() => setScreen("pending")} />
      <div className="grid gap-3 lg:grid-cols-3">
        <AreaButton label="Casa" value="Compras y tareas" icon={Home} onClick={() => setScreen("pending")} />
        <AreaButton label="Botica Spa" value="Limpieza y marketing" icon={Sparkles} onClick={() => setScreen("pending")} />
        <AreaButton label="Walkme" value="Fotos y campanas" icon={Store} onClick={() => setScreen("pending")} />
      </div>

      <SectionTitle title="Lo importante esta semana" action="Ver prioridades" onClick={() => setScreen("crisis")} />
      <div className="space-y-3">
        <InsightRow icon={CalendarClock} label="Pagos importantes" value={money.format(16400)} tone="red" />
        <InsightRow icon={ListChecks} label="Gastos obligatorios" value={money.format(19700)} />
        <InsightRow icon={MinusCircle} label="Gastos recortables" value={money.format(4000)} tone="yellow" />
        <InsightRow icon={Store} label="Negocio que mas drena" value={totals.drainingBusiness} tone="red" />
        <InsightRow icon={PiggyBank} label="Dinero personal usado en negocios" value={money.format(totals.personalBusiness)} />
      </div>

      <SectionTitle title="Separado por area" />
      <div className="grid gap-3 lg:grid-cols-5">
        <AreaButton label="Casa" value={money.format(totals.homeExpenses)} icon={Home} onClick={() => setScreen("home")} />
        <AreaButton label="Walkme" value={money.format(totals.walkmeExpenses)} icon={Store} onClick={() => setScreen("walkme")} />
        <AreaButton label="Botica Spa" value={money.format(totals.boticaExpenses)} icon={Sparkles} onClick={() => setScreen("botica")} />
        <AreaButton label="Gina" value={money.format(totals.ginaExpenses)} icon={UserRound} onClick={() => setScreen("gina")} />
        <AreaButton label="Maria" value={money.format(totals.mariaExpenses)} icon={UserRound} onClick={() => setScreen("maria")} />
      </div>

      <SectionTitle title="Presupuesto" action="Ver presupuesto" onClick={() => setScreen("budget")} />
      <div className="grid gap-3 lg:grid-cols-2">
        <InsightRow icon={PiggyBank} label="Super estimado" value={money.format(8000)} tone="yellow" />
        <InsightRow icon={ReceiptText} label="Carga tickets para ver el real" value="Foto, PDF o manual" />
      </div>

      <CalmNotice text="Recomendacion: pagar renta y minimo de tarjeta, negociar proveedor Walkme y pausar publicidad esta semana." />
    </div>
  );
}

function SettingsQuickCard({ settings, syncStatus, onSave }: { settings: AppSettings; syncStatus: string; onSave: (settings: AppSettings) => void }) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">Datos base</p>
          <p className="mt-1 text-sm text-slate-500">{syncStatus}</p>
        </div>
        <StatusPill label="Desde 1 mayo" tone="green" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Dinero disponible</span>
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            inputMode="decimal"
            value={draft.availableMoney || ""}
            onChange={(event) => setDraft((current) => ({ ...current, availableMoney: Number(event.target.value) }))}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Minimo mensual</span>
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            inputMode="decimal"
            value={draft.monthlySurvivalAmount || ""}
            onChange={(event) => setDraft((current) => ({ ...current, monthlySurvivalAmount: Number(event.target.value) }))}
          />
        </label>
      </div>
      <button className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 font-semibold text-white" onClick={() => onSave(draft)}>
        <Save className="h-4 w-4" />
        Guardar datos base
      </button>
    </Card>
  );
}

function IncomeScreen({
  incomes,
  onSaveIncome,
  onDeleteIncome
}: {
  incomes: Income[];
  onSaveIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<IncomeFilter>("Todos");
  const groupedAreas: IncomeArea[] = ["Botica Spa", "Walkme", "Compartido", "Personal Maria", "Personal Gina", "Prestamo", "Apoyo familiar", "Reembolso", "Otro"];
  const total = incomes.reduce((sum, item) => sum + item.amount, 0);
  const visibleIncomes = selectedArea === "Todos" ? incomes : incomes.filter((item) => item.type === selectedArea);
  const visibleTotal = visibleIncomes.reduce((sum, item) => sum + item.amount, 0);

  function saveIncome(income: Income) {
    onSaveIncome(income);
    setEditingId(null);
  }

  function deleteIncome(id: string) {
    onDeleteIncome(id);
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-bold tracking-normal">Solo ingresos</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Registra todo lo que entra en el dia, semana o mes: ventas, depositos, apoyo, reembolsos o prestamos.</p>
      </div>
      <CalmNotice text="Puedes dictarlo por voz y adjuntar foto o PDF; se guarda en Supabase para que no se pierda al refrescar." />
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total ingresos" value={money.format(total)} />
        <MetricCard label="Registros" value={`${incomes.length}`} />
      </div>
      <AreaFilterTabs
        areas={["Todos", ...groupedAreas]}
        selected={selectedArea}
        totals={Object.fromEntries(groupedAreas.map((area) => [area, incomes.filter((item) => item.type === area).reduce((sum, item) => sum + item.amount, 0)]))}
        onSelect={(area) => setSelectedArea(area as IncomeFilter)}
      />
      <IncomeEditor onSave={saveIncome} defaultType={selectedArea === "Todos" ? "Compartido" : selectedArea} />

      <div className="space-y-3">
        <SectionTitle title={`${selectedArea} - ${money.format(visibleTotal)}`} />
        {visibleIncomes.length === 0 ? (
          <EmptyState text="No hay ingresos en esta seccion todavia." />
        ) : (
          visibleIncomes.map((income) =>
            editingId === income.id ? (
              <IncomeEditor key={income.id} income={income} onSave={saveIncome} onCancel={() => setEditingId(null)} />
            ) : (
              <IncomeItemCard key={income.id} income={income} onEdit={() => setEditingId(income.id)} onDelete={() => deleteIncome(income.id)} />
            )
          )
        )}
      </div>
    </div>
  );
}

function ExpenseScreen({
  expenses,
  onSaveExpense,
  onDeleteExpense
}: {
  expenses: Expense[];
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<ExpenseFilter>("Todos");
  const groupedAreas: ExpenseArea[] = ["Casa", "Botica Spa", "Walkme", "Compartido", "Personal Maria", "Personal Gina", "Deuda", "Suscripcion", "Emergencia", "Otro"];
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const visibleExpenses = selectedArea === "Todos" ? expenses : expenses.filter((item) => item.type === selectedArea);
  const visibleTotal = visibleExpenses.reduce((sum, item) => sum + item.amount, 0);

  function saveExpense(expense: Expense) {
    onSaveExpense(expense);
    setEditingId(null);
  }

  function deleteExpense(id: string) {
    onDeleteExpense(id);
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <CalmNotice text="Los gastos se separan por casa y negocio. Puedes subir foto/PDF o capturarlo manual; se guarda en Supabase para que ya lo puedas usar real." />
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total egresos" value={money.format(total)} />
        <MetricCard label="Registros" value={`${expenses.length}`} />
      </div>
      <AreaFilterTabs
        areas={["Todos", ...groupedAreas]}
        selected={selectedArea}
        totals={Object.fromEntries(groupedAreas.map((area) => [area, expenses.filter((item) => item.type === area).reduce((sum, item) => sum + item.amount, 0)]))}
        onSelect={(area) => setSelectedArea(area as ExpenseFilter)}
      />
      <GoogleSheetsImportCard />
      <ExpenseEditor onSave={saveExpense} defaultType={selectedArea === "Todos" ? "Casa" : selectedArea} />

      <div className="space-y-3">
        <SectionTitle title={`${selectedArea} - ${money.format(visibleTotal)}`} />
        {visibleExpenses.length === 0 ? (
          <EmptyState text="No hay gastos en esta seccion todavia." />
        ) : (
          visibleExpenses.map((expense) =>
            editingId === expense.id ? (
              <ExpenseEditor key={expense.id} expense={expense} onSave={saveExpense} onCancel={() => setEditingId(null)} />
            ) : (
              <ExpenseItemCard key={expense.id} expense={expense} onEdit={() => setEditingId(expense.id)} onDelete={() => deleteExpense(expense.id)} />
            )
          )
        )}
      </div>
    </div>
  );
}

function BudgetScreen({
  budgets,
  onSaveBudget,
  onDeleteBudget,
  expenses,
  setScreen
}: {
  budgets: BudgetItem[];
  onSaveBudget: (budget: BudgetItem) => void;
  onDeleteBudget: (id: string) => void;
  expenses: Expense[];
  setScreen: (screen: Screen) => void;
}) {
  const [selectedArea, setSelectedArea] = useState<"Todos" | BudgetItem["area"]>("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const visibleBudgets = selectedArea === "Todos" ? budgets : budgets.filter((item) => item.area === selectedArea);
  const plannedTotal = visibleBudgets.reduce((sum, item) => sum + item.plannedAmount, 0);
  const actualTotal = visibleBudgets.reduce((sum, item) => sum + budgetActual(item, expenses), 0);
  const fixedTotal = visibleBudgets.filter((item) => item.kind === "fixed").reduce((sum, item) => sum + item.plannedAmount, 0);
  const variableTotal = visibleBudgets.filter((item) => item.kind === "variable").reduce((sum, item) => sum + item.plannedAmount, 0);
  const editingBudget = budgets.find((item) => item.id === editingId);

  function saveBudget(item: BudgetItem) {
    onSaveBudget(item);
    setEditingId(null);
  }

  function deleteBudget(id: string) {
    onDeleteBudget(id);
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-bold tracking-normal">Presupuesto</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Planea gastos fijos y variables. Cada gasto real que registres con ticket, PDF o manual se compara contra el estimado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Presupuestado" value={money.format(plannedTotal)} />
        <MetricCard label="Real gastado" value={money.format(actualTotal)} tone={actualTotal > plannedTotal ? "red" : "default"} />
        <MetricCard label="Gastos fijos" value={money.format(fixedTotal)} />
        <MetricCard label="Variables" value={money.format(variableTotal)} />
      </div>

      <AreaFilterTabs
        areas={["Todos", "Casa", "Walkme", "Botica Spa", "Personal Gina", "Personal Maria", "Compartido"]}
        selected={selectedArea}
        totals={Object.fromEntries(
          ["Casa", "Walkme", "Botica Spa", "Personal Gina", "Personal Maria", "Compartido"].map((area) => [
            area,
            budgets.filter((item) => item.area === area).reduce((sum, item) => sum + item.plannedAmount, 0)
          ])
        )}
        onSelect={(area) => setSelectedArea(area as "Todos" | BudgetItem["area"])}
      />

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {editingBudget ? (
            <BudgetEditor key={editingBudget.id} budget={editingBudget} onSave={saveBudget} onCancel={() => setEditingId(null)} />
          ) : (
            <BudgetEditor onSave={saveBudget} defaultArea={selectedArea === "Todos" ? "Casa" : selectedArea} />
          )}
          <CalmNotice text="Puedes agregar, editar, cambiar monto, mover de area o borrar cualquier partida. Si Supabase falla, queda respaldado en este dispositivo." />
          <button className="min-h-12 w-full rounded-2xl bg-ink px-4 font-semibold text-white" onClick={() => setScreen("expenses")}>
            Cargar ticket o gasto real
          </button>
        </aside>

        <section className="space-y-3">
          <SectionTitle title={`${selectedArea} - comparativo`} />
          {visibleBudgets.length === 0 ? (
            <EmptyState text="No hay partidas de presupuesto en esta seccion." />
          ) : (
            visibleBudgets.map((item) => (
                <BudgetItemCard
                  key={item.id}
                  budget={item}
                  actual={budgetActual(item, expenses)}
                  onEdit={() => setEditingId(item.id)}
                  onDelete={() => deleteBudget(item.id)}
                />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function budgetActual(budget: BudgetItem, expenses: Expense[]) {
  return expenses
    .filter((expense) => expense.type === budget.area && normalizeText(expense.category) === normalizeText(budget.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function BudgetEditor({
  budget,
  defaultArea,
  onSave,
  onCancel
}: {
  budget?: BudgetItem;
  defaultArea?: BudgetItem["area"];
  onSave: (item: BudgetItem) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<BudgetItem>(
    budget ?? {
      id: newRecordId(),
      area: defaultArea ?? "Casa",
      category: "",
      name: "",
      kind: "variable",
      plannedAmount: 0,
      notes: ""
    }
  );

  useEffect(() => {
    if (budget) {
      setDraft(budget);
    }
  }, [budget]);

  function update<K extends keyof BudgetItem>(key: K, value: BudgetItem[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (!draft.name.trim() || !draft.category.trim()) {
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      category: draft.category.trim(),
      plannedAmount: Number.isFinite(draft.plannedAmount) ? draft.plannedAmount : 0
    });
    if (!budget) {
      setDraft({
        id: newRecordId(),
        area: defaultArea ?? "Casa",
        category: "",
        name: "",
        kind: "variable",
        plannedAmount: 0,
        notes: ""
      });
    }
  }

  return (
    <Card>
      <p className="mb-1 font-semibold">{budget ? "Editar presupuesto" : "Agregar presupuesto"}</p>
      <p className="mb-3 text-sm text-slate-500">{budget ? "Cambia cualquier dato y toca Guardar cambios." : "Crea una partida nueva para casa, Botica Spa o Walkme."}</p>
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Nombre</span>
          <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Super y comida" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-600">Area</span>
            <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.area} onChange={(event) => update("area", event.target.value as BudgetItem["area"])}>
              {["Casa", "Walkme", "Botica Spa", "Personal Gina", "Personal Maria", "Compartido"].map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-600">Tipo</span>
            <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.kind} onChange={(event) => update("kind", event.target.value as BudgetKind)}>
              <option value="fixed">Fijo</option>
              <option value="variable">Variable</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-600">Categoria</span>
            <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Comida" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-600">Estimado</span>
            <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" inputMode="decimal" value={draft.plannedAmount || ""} onChange={(event) => update("plannedAmount", Number(event.target.value))} placeholder="0" />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Notas</span>
          <textarea className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Ej. Aun no estoy segura; ajustar con tickets" />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {onCancel ? (
          <button className="min-h-12 rounded-xl bg-slate-100 px-4 font-semibold text-slate-700" onClick={onCancel}>Cancelar</button>
        ) : null}
        <button className={`${onCancel ? "" : "col-span-2"} min-h-12 rounded-xl bg-ink px-4 font-semibold text-white disabled:opacity-50`} onClick={submit} disabled={!draft.name.trim() || !draft.category.trim()}>
          {budget ? "Guardar cambios" : "Guardar presupuesto"}
        </button>
      </div>
    </Card>
  );
}

function BudgetItemCard({ budget, actual, onEdit, onDelete }: { budget: BudgetItem; actual: number; onEdit: () => void; onDelete: () => void }) {
  const difference = budget.plannedAmount - actual;
  const progress = budget.plannedAmount > 0 ? Math.min(100, Math.round((actual / budget.plannedAmount) * 100)) : 0;

  function confirmDelete() {
    if (window.confirm(`Borrar "${budget.name}" del presupuesto?`)) {
      onDelete();
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{budget.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {budget.area} - {budget.category} - {budget.kind === "fixed" ? "Fijo" : "Variable"}
          </p>
        </div>
        <StatusPill label={difference >= 0 ? "Dentro" : "Pasado"} tone={difference >= 0 ? "green" : "red"} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <SmallInfo icon={PiggyBank} label="Estimado" value={money.format(budget.plannedAmount)} />
        <SmallInfo icon={ReceiptText} label="Real" value={money.format(actual)} />
        <SmallInfo icon={MinusCircle} label="Diferencia" value={money.format(difference)} />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${actual > budget.plannedAmount ? "bg-emergency" : "bg-stable"}`} style={{ width: `${progress}%` }} />
      </div>
      {budget.notes ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{budget.notes}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="min-h-11 rounded-xl bg-slate-100 px-3 font-semibold text-slate-700" onClick={onEdit}>
          Editar
        </button>
        <button className="min-h-11 rounded-xl bg-red-50 px-3 font-semibold text-emergency" onClick={confirmDelete}>
          Borrar
        </button>
      </div>
    </Card>
  );
}

function AccountsScreen() {
  const [items, setItems] = useState<Account[]>(() => readStoredList("control30-accounts", initialAccounts));
  const [draft, setDraft] = useState<Account>({
    id: newRecordId(),
    name: "",
    type: "Banco",
    owner: "Compartida",
    balance: 0,
    debt: 0,
    due: "",
    status: "Activa",
    note: ""
  });
  const available = items.filter((item) => item.type !== "Tarjeta credito").reduce((sum, item) => sum + item.balance, 0);
  const cardDebt = items.filter((item) => item.type === "Tarjeta credito").reduce((sum, item) => sum + item.debt, 0);

  useEffect(() => {
    writeStoredList("control30-accounts", items);
  }, [items]);

  function update<K extends keyof Account>(key: K, value: Account[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveAccount() {
    if (!draft.name.trim()) return;
    const next = { ...draft, name: draft.name.trim(), balance: Number(draft.balance) || 0, debt: Number(draft.debt) || 0 };
    setItems((current) => {
      const exists = current.some((item) => item.id === next.id);
      return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
    });
    setDraft({ id: newRecordId(), name: "", type: "Banco", owner: "Compartida", balance: 0, debt: 0, due: "", status: "Activa", note: "" });
  }

  function editAccount(account: Account) {
    setDraft(account);
  }

  function deleteAccount(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function markPaid(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, debt: 0, status: "Pagada", note: item.note || "Pago marcado" } : item)));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-bold tracking-normal">Dinero actual</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Registra lo que tienes hoy: banco, tarjetas, efectivo y ahorros.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Disponible" value={money.format(available)} />
        <MetricCard label="Tarjetas pendiente" value={money.format(cardDebt)} tone={cardDebt > 0 ? "red" : "default"} />
        <MetricCard label="Cuentas" value={`${items.length}`} />
        <MetricCard label="Neto" value={money.format(available - cardDebt)} tone={available - cardDebt < 0 ? "red" : "default"} />
      </div>

      <Card>
        <p className="mb-3 font-bold">{items.some((item) => item.id === draft.id) ? "Editar cuenta" : "Agregar cuenta"}</p>
        <div className="grid gap-3">
          <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej. NU, Plata Card, Banco Azteca, Efectivo" />
          <div className="grid grid-cols-2 gap-3">
            <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.type} onChange={(event) => update("type", event.target.value as Account["type"])}>
              {["Banco", "Tarjeta credito", "Tarjeta debito", "Efectivo", "Ahorros"].map((type) => <option key={type}>{type}</option>)}
            </select>
            <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.owner} onChange={(event) => update("owner", event.target.value as Account["owner"])}>
              {["Maria", "Gina", "Compartida", "Botica Spa", "Walkme"].map((owner) => <option key={owner}>{owner}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" inputMode="decimal" value={draft.balance || ""} onChange={(event) => update("balance", Number(event.target.value))} placeholder="Saldo actual" />
            <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" inputMode="decimal" value={draft.debt || ""} onChange={(event) => update("debt", Number(event.target.value))} placeholder="Deuda pendiente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" type="date" value={draft.due} onChange={(event) => update("due", event.target.value)} />
            <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.status} onChange={(event) => update("status", event.target.value as Account["status"])}>
              {["Activa", "Pendiente pago", "Pagada", "Critica", "Ahorro"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <textarea className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value={draft.note} onChange={(event) => update("note", event.target.value)} placeholder="Notas" />
          <button className="min-h-12 rounded-xl bg-ink px-4 font-semibold text-white disabled:opacity-50" disabled={!draft.name.trim()} onClick={saveAccount}>
            Guardar cuenta
          </button>
        </div>
      </Card>

      <SectionTitle title="Cuentas, tarjetas y efectivo" />
      <div className="space-y-3">
        {items.map((account) => (
          <Card key={account.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{account.name}</p>
                <p className="mt-1 text-sm text-slate-500">{account.type} - {account.owner}</p>
              </div>
              <StatusPill label={account.status} tone={account.status === "Critica" || account.status === "Pendiente pago" ? "red" : "green"} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricCard label="Saldo" value={money.format(account.balance)} compact />
              <MetricCard label="Deuda" value={money.format(account.debt)} compact tone={account.debt > 0 ? "red" : "default"} />
            </div>
            <p className="mt-3 text-sm text-slate-600">{account.note}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button className="min-h-10 rounded-xl bg-slate-100 px-2 text-xs font-bold text-slate-700" onClick={() => editAccount(account)}>Editar</button>
              <button className="min-h-10 rounded-xl bg-green-50 px-2 text-xs font-bold text-stable" onClick={() => markPaid(account.id)}>Marcar pago</button>
              <button className="min-h-10 rounded-xl bg-red-50 px-2 text-xs font-bold text-emergency" onClick={() => deleteAccount(account.id)}>Borrar</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DebtsScreen() {
  return (
    <div className="space-y-4">
      <MockForm fields={["Nombre de la deuda", "Acreedor", "Monto total", "Pago minimo", "Fecha de pago", "Cuenta asociada", "Prioridad", "Estado", "Notas"]} />
      <SectionTitle title="Deudas separadas" />
      {debts.map((debt) => (
        <DebtCard key={debt.name} debt={debt} />
      ))}
    </div>
  );
}

function SubscriptionsScreen() {
  return (
    <div className="space-y-4">
      <MockForm fields={["Nombre", "Monto mensual", "Fecha de cobro", "Tipo", "Categoria", "Prioridad", "Cuenta o tarjeta", "Estado", "Notas"]} />
      <SectionTitle title="Suscripciones" />
      <div className="space-y-3">
        {subscriptions.map((item) => (
          <Card key={item.name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">{item.type} - {item.category}</p>
              </div>
              <StatusPill label={item.priority} tone={item.priority === "Cancelar" ? "red" : item.priority === "Pausar" ? "yellow" : "green"} />
            </div>
            <p className="mt-3 text-2xl font-bold">{money.format(item.amount)}</p>
            <p className="text-sm text-slate-500">Se cobra el {item.billing} en {item.account}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PaymentsScreen() {
  const groups = ["Hoy", "Esta semana", "Este mes", "Atrasados", "Pagados"];
  return (
    <div className="space-y-4">
      <MockForm fields={["Nombre del pago", "Monto", "Fecha limite", "Tipo", "Prioridad", "Estado", "Cuenta sugerida", "Negocio relacionado", "Notas"]} />
      {groups.map((group) => (
        <div key={group} className="space-y-2">
          <SectionTitle title={group} />
          {upcomingPayments.filter((payment) => payment.group === group).length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Sin pagos en esta seccion.</p>
          ) : (
            upcomingPayments
              .filter((payment) => payment.group === group)
              .map((payment) => <PaymentCard key={payment.name} payment={payment} />)
          )}
        </div>
      ))}
    </div>
  );
}

function paymentToAgendaItem(payment: (typeof upcomingPayments)[number]): AgendaItem {
  return {
    id: `payment-${payment.name.toLowerCase().replace(/\s+/g, "-")}`,
    title: payment.name,
    description: `${payment.type} - ${payment.priority}`,
    date: payment.due,
    time: "09:00",
    type: payment.type === "Deuda" ? "debt" : "payment",
    area: payment.type === "Walkme" ? "walkme" : payment.type === "Casa" ? "home" : "shared",
    amount: payment.amount,
    priority: payment.priority === "Pagar si o si" ? "must_pay" : payment.priority === "Negociar" ? "negotiable" : "important",
    status: payment.status === "Atrasado" ? "overdue" : payment.status === "Pagado" ? "paid" : "pending",
    assignee: "Ambas",
    source: "upcoming_payment",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01"
  };
}

function sumAgendaAmount(items: AgendaItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function PendingScreen({
  items,
  onSaveItem,
  onUpdateStatus,
  onDeleteItem
}: {
  items: AgendaItem[];
  onSaveItem: (item: AgendaItem) => void;
  onUpdateStatus: (id: string, status: AgendaStatus) => void;
  onDeleteItem: (id: string) => void;
}) {
  const [selectedArea, setSelectedArea] = useState<"Todos" | AgendaArea>("Todos");
  const [selectedAssignee, setSelectedAssignee] = useState<"Todos" | AgendaAssignee>("Todos");
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const pendingTypes: AgendaType[] = ["task", "pending", "reminder", "sale"];
  const pendingItems = items.filter((item) => pendingTypes.includes(item.type));
  const openItems = pendingItems.filter((item) => !["done", "paid"].includes(item.status));
  const visibleItems = pendingItems.filter((item) => {
    const areaMatch = selectedArea === "Todos" || item.area === selectedArea;
    const assigneeMatch = selectedAssignee === "Todos" || item.assignee === selectedAssignee || item.assignee === "Ambas";
    return areaMatch && assigneeMatch;
  });
  const areaTotals = Object.fromEntries(
    (["home", "botica_spa", "walkme", "maria", "gina", "shared"] as AgendaArea[]).map((area) => [
      agendaAreaLabel(area),
      pendingItems.filter((item) => item.area === area && !["done", "paid"].includes(item.status)).length
    ])
  );
  const mariaOpen = openItems.filter((item) => item.assignee === "Maria" || item.assignee === "Ambas").length;
  const ginaOpen = openItems.filter((item) => item.assignee === "Gina" || item.assignee === "Ambas").length;

  function saveItem(item: AgendaItem) {
    onSaveItem({ ...item, type: item.type === "payment" || item.type === "debt" || item.type === "subscription" ? "pending" : item.type });
    setEditingItem(null);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-bold tracking-normal">Pendientes</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Agenda de pendientes de casa y trabajo, separada por area y por responsable.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Abiertos" value={`${openItems.length}`} />
        <MetricCard label="Maria" value={`${mariaOpen}`} />
        <MetricCard label="Gina" value={`${ginaOpen}`} />
        <MetricCard label="Hoy" value={`${pendingItems.filter((item) => item.date === "2026-05-01" && !["done", "paid"].includes(item.status)).length}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <p className="mb-3 font-bold">{editingItem ? "Editar pendiente" : "Nuevo pendiente"}</p>
            <AgendaItemForm
              item={editingItem ?? undefined}
              defaultType="pending"
              defaultArea={selectedArea === "Todos" ? "home" : selectedArea}
              defaultAssignee={selectedAssignee === "Todos" ? "Ambas" : selectedAssignee}
              onSave={saveItem}
            />
            {editingItem ? (
              <button className="mt-3 min-h-11 w-full rounded-xl bg-slate-100 px-3 font-semibold text-slate-700" onClick={() => setEditingItem(null)}>
                Cancelar edicion
              </button>
            ) : null}
          </Card>
          <CalmNotice text="Ejemplos: comprar comida hijes, limpiar el refri, cambiar fotos en Walkme, limpiar sabanas Botica Spa, sacar campana de marketing. Puedes asignarlo a Maria, Gina o ambas." />
        </aside>

        <section className="space-y-4">
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {(["Todos", "home", "botica_spa", "walkme", "maria", "gina", "shared"] as const).map((area) => {
                const label = area === "Todos" ? "Todos" : agendaAreaLabel(area);
                const selected = selectedArea === area;
                return (
                  <button
                    key={area}
                    className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold ${selected ? "bg-ink text-white" : "bg-white text-slate-700 shadow-sm"}`}
                    onClick={() => setSelectedArea(area)}
                  >
                    {label} {area !== "Todos" ? `(${areaTotals[label] ?? 0})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["Todos", "Maria", "Gina"] as const).map((assignee) => (
              <button
                key={assignee}
                className={`min-h-11 rounded-xl px-3 text-sm font-bold ${selectedAssignee === assignee ? "bg-olive text-white" : "bg-white text-slate-700 shadow-sm"}`}
                onClick={() => setSelectedAssignee(assignee)}
              >
                {assignee}
              </button>
            ))}
          </div>

          <AgendaDayGroup
            title={selectedArea === "Todos" ? "Todos los pendientes" : agendaAreaLabel(selectedArea)}
            subtitle={`${visibleItems.length} registros`}
            items={visibleItems}
            onDone={(id) => onUpdateStatus(id, "done")}
            onPaid={(id) => onUpdateStatus(id, "paid")}
            onNegotiated={(id) => onUpdateStatus(id, "negotiated")}
            onEdit={(item) => setEditingItem(item)}
            onDelete={onDeleteItem}
          />
        </section>
      </div>
    </div>
  );
}

function AgendaScreen({
  storedItems,
  onSaveItem,
  onUpdateStatus,
  onDeleteItem
}: {
  storedItems: AgendaItem[];
  onSaveItem: (item: AgendaItem) => void;
  onUpdateStatus: (id: string, status: AgendaStatus) => void;
  onDeleteItem: (id: string) => void;
}) {
  const [tab, setTab] = useState<"Hoy" | "Semana" | "Mes" | "Atrasados" | "Pagados">("Semana");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formType, setFormType] = useState<AgendaType | null>(null);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const items = useMemo(() => [...upcomingPayments.map(paymentToAgendaItem), ...storedItems], [storedItems]);
  const weekDays = [
    { label: "Hoy", day: "Vie", date: "2026-05-01" },
    { label: "Sabado", day: "Sab", date: "2026-05-02" },
    { label: "Domingo", day: "Dom", date: "2026-05-03" },
    { label: "Lunes", day: "Lun", date: "2026-05-04" },
    { label: "Martes", day: "Mar", date: "2026-05-05" },
    { label: "Miercoles", day: "Mie", date: "2026-05-06" },
    { label: "Jueves", day: "Jue", date: "2026-05-07" }
  ];

  const todayItems = items.filter((item) => item.date === "2026-05-01" && !["done", "paid"].includes(item.status));
  const weekItems = items.filter((item) => item.date >= "2026-05-01" && item.date <= "2026-05-07");
  const overdueItems = items.filter((item) => item.status === "overdue" || item.date < "2026-05-01");
  const paidItems = items.filter((item) => item.status === "paid" || item.status === "done");
  const urgentPayments = items.filter((item) => item.type === "payment" && ["urgent", "must_pay"].includes(item.priority) && !["paid", "done"].includes(item.status));
  const visibleItems =
    tab === "Hoy" ? todayItems : tab === "Semana" ? weekItems : tab === "Mes" ? items : tab === "Atrasados" ? overdueItems : paidItems;

  function saveItem(item: AgendaItem) {
    onSaveItem({ ...item, updatedAt: new Date().toISOString() });
    setDrawerOpen(false);
    setFormType(null);
    setEditingItem(null);
  }

  function updateStatus(id: string, status: AgendaStatus) {
    onUpdateStatus(id, status);
  }

  function deleteItem(id: string) {
    onDeleteItem(id);
  }

  function openForm(type: AgendaType) {
    setFormType(type);
    setEditingItem(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-normal">Agenda</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Pagos, pendientes y tareas de la semana.</p>
        </div>
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 font-semibold text-white"
          onClick={() => {
            setDrawerOpen(true);
            setFormType(null);
            setEditingItem(null);
          }}
        >
          <Plus className="h-5 w-5" />
          Agendar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AgendaSummaryCard title="Hoy" count={todayItems.length} amount={sumAgendaAmount(todayItems)} tone="default" />
        <AgendaSummaryCard title="Esta semana" count={weekItems.length} amount={sumAgendaAmount(weekItems)} tone="yellow" />
        <AgendaSummaryCard title="Atrasados" count={overdueItems.length} amount={sumAgendaAmount(overdueItems)} tone="red" />
        <AgendaSummaryCard title="Pagos urgentes" count={urgentPayments.length} amount={sumAgendaAmount(urgentPayments)} tone="red" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {(["Hoy", "Semana", "Mes", "Atrasados", "Pagados"] as const).map((item) => (
                <button
                  key={item}
                  className={`min-h-11 rounded-xl px-3 text-left font-semibold ${tab === item ? "bg-ink text-white" : "bg-slate-50 text-slate-700"}`}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <CalmNotice text="Los pagos proximos aparecen aqui sin duplicarse: se leen como items de agenda para poder verlos junto con tareas y pendientes." />
        </aside>

        <section className="space-y-4">
          {tab === "Semana" ? (
            <div className="grid gap-3">
              {weekDays.map((day) => (
                <AgendaDayGroup
                  key={day.date}
                  title={day.label}
                  subtitle={`${day.day} ${day.date.slice(-2)}`}
                  items={items.filter((item) => item.date === day.date)}
                  onDone={(id) => updateStatus(id, "done")}
                  onPaid={(id) => updateStatus(id, "paid")}
                  onNegotiated={(id) => updateStatus(id, "negotiated")}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setFormType(item.type);
                    setDrawerOpen(true);
                  }}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          ) : (
            <AgendaDayGroup
              title={tab}
              subtitle={`${visibleItems.length} registros`}
              items={visibleItems}
              onDone={(id) => updateStatus(id, "done")}
              onPaid={(id) => updateStatus(id, "paid")}
              onNegotiated={(id) => updateStatus(id, "negotiated")}
              onEdit={(item) => {
                setEditingItem(item);
                setFormType(item.type);
                setDrawerOpen(true);
              }}
              onDelete={deleteItem}
            />
          )}
        </section>
      </div>

      {drawerOpen ? (
        <AgendaDrawer
          selectedType={formType}
          editingItem={editingItem}
          onClose={() => {
            setDrawerOpen(false);
            setFormType(null);
            setEditingItem(null);
          }}
          onPick={openForm}
          onSave={saveItem}
        />
      ) : null}
    </div>
  );
}

function AgendaSummaryCard({ title, count, amount, tone }: { title: string; count: number; amount: number; tone: "default" | "yellow" | "red" }) {
  const toneClass = tone === "red" ? "text-emergency" : tone === "yellow" ? "text-alert" : "text-ink";
  return (
    <Card>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${toneClass}`}>{count}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{amount > 0 ? money.format(amount) : "Sin monto"}</p>
    </Card>
  );
}

function AgendaDayGroup({
  title,
  subtitle,
  items,
  onDone,
  onPaid,
  onNegotiated,
  onEdit,
  onDelete
}: {
  title: string;
  subtitle: string;
  items: AgendaItem[];
  onDone: (id: string) => void;
  onPaid: (id: string) => void;
  onNegotiated: (id: string) => void;
  onEdit: (item: AgendaItem) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        <p className="text-sm font-bold text-slate-600">{money.format(sumAgendaAmount(sorted))}</p>
      </div>
      {sorted.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Sin pendientes en este bloque.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <AgendaItemCard
              key={item.id}
              item={item}
              onDone={() => onDone(item.id)}
              onPaid={() => onPaid(item.id)}
              onNegotiated={() => onNegotiated(item.id)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaItemCard({
  item,
  onDone,
  onPaid,
  onNegotiated,
  onEdit,
  onDelete
}: {
  item: AgendaItem;
  onDone: () => void;
  onPaid: () => void;
  onNegotiated: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{item.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {item.time} · {agendaTypeLabel(item.type)} · {agendaAreaLabel(item.area)} · {item.assignee}
          </p>
        </div>
        <p className="shrink-0 font-bold">{item.amount > 0 ? money.format(item.amount) : ""}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <AgendaBadge label={agendaPriorityLabel(item.priority)} tone={priorityTone(item.priority)} />
        <AgendaBadge label={agendaStatusLabel(item.status)} tone={statusTone(item.status)} />
      </div>
      {item.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <button className="min-h-10 rounded-xl bg-white px-2 text-xs font-bold text-slate-700" onClick={onDone}>
          Hecho
        </button>
        <button className="min-h-10 rounded-xl bg-green-50 px-2 text-xs font-bold text-stable" onClick={onPaid}>
          Pagado
        </button>
        <button className="min-h-10 rounded-xl bg-blue-50 px-2 text-xs font-bold text-blue-700" onClick={onNegotiated}>
          Negociado
        </button>
        <button className="min-h-10 rounded-xl bg-white px-2 text-xs font-bold text-slate-700" onClick={onEdit}>
          Editar
        </button>
        <button className="min-h-10 rounded-xl bg-red-50 px-2 text-xs font-bold text-emergency" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

function AgendaDrawer({
  selectedType,
  editingItem,
  onClose,
  onPick,
  onSave
}: {
  selectedType: AgendaType | null;
  editingItem: AgendaItem | null;
  onClose: () => void;
  onPick: (type: AgendaType) => void;
  onSave: (item: AgendaItem) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/40 px-4 pb-4 lg:items-center lg:justify-center" onClick={onClose}>
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-3xl bg-white p-4 shadow-soft lg:max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xl font-bold">{editingItem ? "Editar agenda" : selectedType ? "Nuevo registro" : "Agendar"}</p>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100" onClick={onClose} aria-label="Cerrar agenda">
            <X className="h-4 w-4" />
          </button>
        </div>
        {!selectedType && !editingItem ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["payment", "Agregar pago"],
              ["task", "Agregar tarea"],
              ["debt", "Agregar deuda"],
              ["subscription", "Agregar suscripcion"],
              ["pending", "Agregar pendiente"]
            ].map(([type, label]) => (
              <button
                key={type}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-left font-semibold"
                onClick={() => onPick(type as AgendaType)}
              >
                <Plus className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <AgendaItemForm item={editingItem ?? undefined} defaultType={selectedType ?? "task"} onSave={onSave} />
        )}
      </div>
    </div>
  );
}

function AgendaItemForm({
  item,
  defaultType,
  defaultArea = "shared",
  defaultAssignee = "Ambas",
  onSave
}: {
  item?: AgendaItem;
  defaultType: AgendaType;
  defaultArea?: AgendaArea;
  defaultAssignee?: AgendaAssignee;
  onSave: (item: AgendaItem) => void;
}) {
  const [draft, setDraft] = useState<AgendaItem>(
    item ?? {
      id: newRecordId(),
      title: "",
      description: "",
      date: "2026-05-01",
      time: "09:00",
      type: defaultType,
      area: defaultArea,
      amount: 0,
      priority: defaultType === "payment" || defaultType === "debt" ? "must_pay" : "important",
      status: "pending",
      assignee: defaultAssignee,
      source: "agenda",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  function update<K extends keyof AgendaItem>(key: K, value: AgendaItem[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm font-semibold text-slate-600">Titulo</span>
        <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.title} onChange={(event) => update("title", event.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Fecha</span>
          <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Hora</span>
          <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" type="time" value={draft.time} onChange={(event) => update("time", event.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Tipo</span>
          <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.type} onChange={(event) => update("type", event.target.value as AgendaType)}>
            {["payment", "task", "debt", "subscription", "reminder", "sale", "pending"].map((value) => (
              <option key={value} value={value}>{agendaTypeLabel(value as AgendaType)}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Area</span>
          <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.area} onChange={(event) => update("area", event.target.value as AgendaArea)}>
            {["home", "maria", "gina", "shared", "botica_spa", "walkme"].map((value) => (
              <option key={value} value={value}>{agendaAreaLabel(value as AgendaArea)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Monto</span>
          <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" inputMode="decimal" value={draft.amount || ""} onChange={(event) => update("amount", Number(event.target.value))} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-600">Prioridad</span>
          <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.priority} onChange={(event) => update("priority", event.target.value as AgendaPriority)}>
            {["urgent", "must_pay", "important", "negotiable", "pause", "low"].map((value) => (
              <option key={value} value={value}>{agendaPriorityLabel(value as AgendaPriority)}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-sm font-semibold text-slate-600">Responsable</span>
        <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none" value={draft.assignee} onChange={(event) => update("assignee", event.target.value as AgendaAssignee)}>
          {["Maria", "Gina", "Ambas"].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-sm font-semibold text-slate-600">Descripcion</span>
        <textarea className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value={draft.description} onChange={(event) => update("description", event.target.value)} />
      </label>
      <button className="flex min-h-12 items-center justify-center rounded-xl bg-ink px-4 font-semibold text-white disabled:opacity-50" disabled={!draft.title.trim()} onClick={() => onSave({ ...draft, title: draft.title.trim() })}>
        Guardar
      </button>
    </div>
  );
}

function AreaDetailScreen({
  area,
  expenses,
  incomes,
  budgets,
  onSaveExpense,
  onSaveIncome,
  setScreen
}: {
  area: "Casa" | "Botica Spa" | "Walkme" | "Personal Gina" | "Personal Maria";
  expenses: Expense[];
  incomes: Income[];
  budgets: BudgetItem[];
  onSaveExpense: (expense: Expense) => void;
  onSaveIncome: (income: Income) => void;
  setScreen: (screen: Screen) => void;
}) {
  const areaExpenses = expenses.filter((item) => item.type === area);
  const areaIncomes = incomes.filter((item) => item.type === area);
  const areaBudgets = budgets.filter((item) => item.area === area);
  const total = areaExpenses.reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = areaIncomes.reduce((sum, item) => sum + item.amount, 0);
  const budgetTotal = areaBudgets.reduce((sum, item) => sum + item.plannedAmount, 0);
  const personal = areaExpenses.filter((item) => item.paidPersonally).reduce((sum, item) => sum + item.amount, 0);
  const areaSubscriptions = subscriptions.filter((item) => item.type === area);
  const topCategory = topExpenseCategory(areaExpenses);
  const isBusinessArea = area === "Botica Spa" || area === "Walkme";
  const isPersonalArea = area === "Personal Gina" || area === "Personal Maria";
  const dailyGoal = isBusinessArea ? Math.ceil(Math.max(total, budgetTotal) / 30) : Math.ceil(budgetTotal / 30);
  const areaLabel = area === "Personal Gina" ? "Gina" : area === "Personal Maria" ? "Maria" : area;
  return (
    <div className="space-y-4">
      <StatusHero
        title={`${areaLabel} - resumen`}
        message={`${areaLabel} tiene ${areaExpenses.length} gastos registrados y ${areaBudgets.length} partidas de presupuesto desde el 1 de mayo.`}
        value={money.format(incomeTotal - total)}
        subvalue={isBusinessArea ? `Dinero personal usado: ${money.format(personal)}` : `Presupuesto estimado: ${money.format(budgetTotal)}`}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Ingresos" value={money.format(incomeTotal)} />
        <MetricCard label="Gastos" value={money.format(total)} />
        <MetricCard label="Balance" value={money.format(incomeTotal - total)} tone={incomeTotal - total < 0 ? "red" : "default"} />
        <MetricCard label="Meta diaria" value={money.format(dailyGoal)} />
      </div>

      <CalmNotice text={isBusinessArea ? `Para cubrir ${areaLabel}, la meta diaria minima es ${money.format(dailyGoal)} con los gastos/presupuesto registrados.` : `Para ${areaLabel}, el presupuesto diario estimado es ${money.format(dailyGoal)}.`} />

      <div className="grid gap-3 lg:grid-cols-5">
        <AreaButton label="Casa" value={money.format(expenses.filter((item) => item.type === "Casa").reduce((sum, item) => sum + item.amount, 0))} icon={Home} onClick={() => setScreen("home")} />
        <AreaButton label="Walkme" value={money.format(expenses.filter((item) => item.type === "Walkme").reduce((sum, item) => sum + item.amount, 0))} icon={Store} onClick={() => setScreen("walkme")} />
        <AreaButton label="Botica Spa" value={money.format(expenses.filter((item) => item.type === "Botica Spa").reduce((sum, item) => sum + item.amount, 0))} icon={Sparkles} onClick={() => setScreen("botica")} />
        <AreaButton label="Gina" value={money.format(expenses.filter((item) => item.type === "Personal Gina").reduce((sum, item) => sum + item.amount, 0))} icon={UserRound} onClick={() => setScreen("gina")} />
        <AreaButton label="Maria" value={money.format(expenses.filter((item) => item.type === "Personal Maria").reduce((sum, item) => sum + item.amount, 0))} icon={UserRound} onClick={() => setScreen("maria")} />
      </div>

      <QuickMoneyCapture area={area} onSaveExpense={onSaveExpense} onSaveIncome={onSaveIncome} />

      <div className="grid grid-cols-2 gap-3">
        <button className="min-h-12 rounded-2xl bg-white px-4 font-semibold text-slate-700 shadow-sm" onClick={() => setScreen("expenses")}>
          Captura detallada de gasto
        </button>
        <button className="min-h-12 rounded-2xl bg-white px-4 font-semibold text-slate-700 shadow-sm" onClick={() => setScreen("incomes")}>
          Captura detallada de ingreso
        </button>
      </div>

      <SectionTitle title="Presupuesto vs real" action="Editar presupuesto" onClick={() => setScreen("budget")} />
      <div className="space-y-3">
        {areaBudgets.length === 0 ? (
          <EmptyState text={`Sin presupuesto registrado para ${area}.`} />
        ) : (
          areaBudgets.map((item) => (
            <BudgetItemCard key={item.id} budget={item} actual={budgetActual(item, expenses)} onEdit={() => setScreen("budget")} onDelete={() => setScreen("budget")} />
          ))
        )}
      </div>

      <SectionTitle title="Ingresos registrados" />
      <div className="space-y-3">
        {areaIncomes.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Sin ingresos registrados para {area}.</p>
        ) : (
          areaIncomes.map((item) => <InsightRow key={item.id} icon={ArrowUpCircle} label={item.source} value={money.format(item.amount)} />)
        )}
      </div>

      <SectionTitle title="Gastos mas altos" />
      <div className="space-y-3">
        {areaExpenses.map((item) => (
          <InsightRow key={item.name} icon={ReceiptText} label={item.name} value={money.format(item.amount)} />
        ))}
      </div>

      <SectionTitle title="Categoria con mas gasto" />
      <InsightRow icon={ReceiptText} label={topCategory.label} value={money.format(topCategory.amount)} />

      <SectionTitle title="Suscripciones asignadas" />
      <div className="space-y-3">
        {areaSubscriptions.length === 0 ? (
          <EmptyState text={`Sin suscripciones asignadas a ${area}.`} />
        ) : areaSubscriptions.map((item) => (
          <InsightRow key={item.name} icon={Bell} label={item.name} value={money.format(item.amount)} tone={item.priority === "Pausar" ? "yellow" : "default"} />
        ))}
      </div>
    </div>
  );
}

function topExpenseCategory(expenses: Expense[]) {
  const totals = expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {});
  const [label, amount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] ?? ["Sin gastos", 0];
  return { label, amount };
}

function QuickMoneyCapture({
  area,
  onSaveExpense,
  onSaveIncome
}: {
  area: "Casa" | "Botica Spa" | "Walkme" | "Personal Gina" | "Personal Maria";
  onSaveExpense: (expense: Expense) => void;
  onSaveIncome: (income: Income) => void;
}) {
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayDate());
  const [frequency, setFrequency] = useState<ExpenseFrequency>("once");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const areaLabel = area === "Personal Gina" ? "Gina" : area === "Personal Maria" ? "Maria" : area;

  function reset() {
    setTitle("");
    setAmount("");
    setCategory("");
    setFrequency("once");
    setNotes("");
    setFile(undefined);
  }

  function save() {
    const numericAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const isPdf = file?.type === "application/pdf";
    const isImage = Boolean(file?.type.startsWith("image/"));

    if (mode === "income") {
      const incomeType = incomeTypeForArea(area);
      onSaveIncome({
        id: newRecordId(),
        date,
        source: title.trim(),
        type: incomeType,
        amount: numericAmount,
        account: "Cuenta Maria",
        method: "Manual",
        notes: notes.trim(),
        business: incomeType === "Botica Spa" || incomeType === "Walkme" ? incomeType : undefined,
        attachmentName: file?.name,
        attachmentType: file ? (isPdf ? "pdf" : "image") : undefined,
        attachmentUrl: isImage && file ? URL.createObjectURL(file) : undefined,
        attachmentFile: file
      });
    } else {
      onSaveExpense({
        id: newRecordId(),
        date,
        name: title.trim(),
        amount: numericAmount,
        type: area,
        category: category.trim() || "Sin categoria",
        priority: "important",
        frequency,
        paidBy: area === "Personal Gina" ? "Gina" : area === "Personal Maria" ? "Maria" : "Compartido",
        due: date,
        business: area === "Botica Spa" || area === "Walkme" ? area : undefined,
        paidPersonally: area === "Botica Spa" || area === "Walkme",
        notes: notes.trim(),
        attachmentName: file?.name,
        attachmentType: file ? (isPdf ? "pdf" : "image") : undefined,
        attachmentUrl: isImage && file ? URL.createObjectURL(file) : undefined,
        attachmentFile: file
      });
    }
    reset();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">Captura rapida</p>
          <p className="mt-1 text-sm text-slate-500">Agrega ingresos o egresos de {areaLabel} sin llenar todo el formulario.</p>
        </div>
        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold">
          <button className={`rounded-xl px-3 py-2 ${mode === "expense" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`} onClick={() => setMode("expense")}>
            Egreso
          </button>
          <button className={`rounded-xl px-3 py-2 ${mode === "income" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`} onClick={() => setMode("income")}>
            Ingreso
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={mode === "income" ? "Ej. venta, deposito, apoyo" : "Ej. super, luz, sabanas, publicidad"}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Monto"
          />
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder={mode === "income" ? "Categoria opcional" : "Categoria"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <input
            className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0])}
          />
        </div>
        {mode === "expense" ? (
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Frecuencia del gasto</span>
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as ExpenseFrequency)}
            >
              {expenseFrequencies.map((item) => (
                <option key={item} value={item}>
                  {frequencyLabel(item)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <textarea
          className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-400"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Descripcion manual opcional"
        />
        {file ? <p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-stable">Comprobante listo: {file.name}</p> : null}
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-semibold text-white disabled:opacity-50" disabled={!title.trim() || !amount} onClick={save}>
          <Save className="h-4 w-4" />
          Guardar {mode === "income" ? "ingreso" : "egreso"}
        </button>
      </div>
    </Card>
  );
}

function CrisisScreen({
  totals,
  setScreen
}: {
  totals: ReturnType<typeof useTotalsShape>;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-4">
      <StatusHero
        title="Prioridad de hoy"
        message="Ordenar pagos importantes, revisar Walkme y pausar suscripciones no necesarias antes de tomar mas deuda."
        value={money.format(totals.shortfall)}
        subvalue="Faltante para cubrir el mes"
      />
      <CrisisBlock title="Pagar si o si" items={["Renta casa - $14,500", "Pago minimo Tarjeta Gina - $1,900"]} tone="red" />
      <CrisisBlock title="Negociar" items={["Proveedor Walkme - $4,200", "Municipio 1.20 Walkme - $2,500", "Trino Walkme - $1,750"]} tone="yellow" />
      <CrisisBlock title="Pausar" items={["Publicidad Botica Spa - $2,800", "Herramienta IA - $600"]} tone="yellow" />
      <CrisisBlock title="Eliminar" items={["Apps no esenciales - $1,200", "Streaming - $299"]} />
      <CrisisBlock title="Deudas por atender" items={["Proveedor Walkme esta atrasado", "Tarjeta Gina vence esta semana"]} tone="red" />
      <CrisisBlock title="Negocio con mayor gasto" items={[`${totals.drainingBusiness} esta usando mas dinero del que genera`]} tone="red" />
      <CrisisBlock
        title="Acciones de seguimiento"
        items={["Negociar proveedor Walkme hoy", "Contactar 10 clientas de Botica Spa", "Cancelar streaming antes del cobro"]}
        tone="yellow"
      />
      <Card>
        <p className="text-sm font-semibold text-slate-500">Meta minima de ventas</p>
        <p className="mt-2 text-3xl font-bold">{money.format(totals.weeklySalesGoal)}</p>
        <p className="mt-2 text-sm text-slate-600">Si no hay ventas esta semana, necesitan generar al menos esta cantidad por fuera.</p>
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-semibold text-white" onClick={() => setScreen("planb")}>
          Abrir Plan B <ChevronRight className="h-4 w-4" />
        </button>
      </Card>
    </div>
  );
}

function PlanBScreen({ totals, settings }: { totals: ReturnType<typeof useTotalsShape>; settings: AppSettings }) {
  const externalNeeded = Math.max(0, settings.monthlySurvivalAmount - settings.availableMoney);
  return (
    <div className="space-y-4">
      <StatusHero
        title="Plan familiar activo"
        message={`Con ${money.format(settings.availableMoney)} disponibles y gastos minimos de ${money.format(settings.monthlySurvivalAmount)}, faltan ${money.format(externalNeeded)} para cubrir el mes.`}
        value={money.format(externalNeeded)}
        subvalue="Ingreso externo necesario"
      />
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Maria podria generar" value={money.format(Math.ceil(externalNeeded / 2))} />
        <MetricCard label="Gina podria generar" value={money.format(Math.ceil(externalNeeded / 2))} />
        <MetricCard label="Negocios deben vender" value={money.format(totals.weeklySalesGoal)} />
        <MetricCard label="Fecha limite" value={`${totals.survivalDays} dias`} tone="red" />
      </div>
      <CalmNotice text="Llevan mas de 21 dias sin ingresos. La app sugiere revisar ingresos externos si no hay ventas esta semana." />
      <MockForm fields={["Ingreso meta de Maria", "Ingreso meta de Gina", "Ingreso meta Botica Spa", "Ingreso meta Walkme", "Gasto minimo de supervivencia", "Tiempo maximo sin ingresos", "Notas"]} />
      <CrisisBlock title="Antes de buscar mas deuda" items={["Cortar streaming y apps no esenciales", "Pausar publicidad hasta tener ventas", "Negociar proveedor y renta local"]} />
    </div>
  );
}

function FormScreen({
  intro,
  fields,
  listTitle,
  items
}: {
  intro: string;
  fields: string[];
  listTitle: string;
  items: Array<{ title: string; meta: string; amount: number }>;
}) {
  return (
    <div className="space-y-4">
      <CalmNotice text={intro} />
      <MockForm fields={fields} />
      <SectionTitle title={listTitle} />
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
              </div>
              <p className="font-bold">{money.format(item.amount)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

type SpeechRecognitionResultLike = {
  readonly 0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  results: {
    readonly 0: SpeechRecognitionResultLike;
  };
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function IncomeEditor({
  income,
  defaultType = "Compartido",
  onSave,
  onCancel
}: {
  income?: Income;
  defaultType?: IncomeArea;
  onSave: (income: Income) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Income>(
    income ?? {
      id: newRecordId(),
      date: "2026-05-01",
      source: "",
      type: defaultType,
      amount: 0,
      account: "Cuenta Maria",
      method: "Manual",
      notes: "",
      business: defaultType === "Botica Spa" || defaultType === "Walkme" ? defaultType : undefined
    }
  );
  const [voiceStatus, setVoiceStatus] = useState("Dicta algo como: venta Botica Spa 1200 por transferencia");

  function update<K extends keyof Income>(key: K, value: Income[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "type") {
        next.business = value === "Botica Spa" || value === "Walkme" ? value : undefined;
      }
      return next;
    });
  }

  function applyTranscript(transcript: string) {
    const amountMatch = transcript.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? Number(amountMatch[1]) : draft.amount;
    const normalized = transcript.toLowerCase();
    const type: IncomeArea = normalized.includes("botica")
      ? "Botica Spa"
      : normalized.includes("walkme")
        ? "Walkme"
        : normalized.includes("gina")
          ? "Personal Gina"
          : normalized.includes("maria") || normalized.includes("maría")
            ? "Personal Maria"
            : draft.type;
    const method = normalized.includes("transfer") ? "Transferencia" : normalized.includes("efectivo") ? "Efectivo" : draft.method;

    setDraft((current) => ({
      ...current,
      source: current.source || transcript,
      amount,
      type,
      business: type === "Botica Spa" || type === "Walkme" ? type : undefined,
      method,
      notes: current.notes ? `${current.notes}\nVoz: ${transcript}` : `Voz: ${transcript}`
    }));
  }

  function startVoice() {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus("Este navegador no permite dictado por voz aqui. Puedes escribirlo manualmente.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "es-MX";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      applyTranscript(transcript);
      setVoiceStatus(`Voz capturada: ${transcript}`);
    };
    recognition.onend = () => setVoiceStatus("Dictado terminado.");
    setVoiceStatus("Escuchando...");
    recognition.start();
  }

  function attachFile(file: File | undefined) {
    if (!file) {
      return;
    }
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    update("attachmentName", file.name);
    update("attachmentType", isPdf ? "pdf" : "image");
    update("attachmentUrl", isImage ? URL.createObjectURL(file) : undefined);
    update("attachmentFile", file);
  }

  function submit() {
    if (!draft.source.trim()) {
      return;
    }
    onSave({
      ...draft,
      source: draft.source.trim(),
      amount: Number.isFinite(draft.amount) ? draft.amount : 0,
      business: draft.type === "Botica Spa" || draft.type === "Walkme" ? draft.type : undefined
    });
    if (!income) {
      setDraft({
        id: newRecordId(),
        date: "2026-05-01",
        source: "",
        type: defaultType,
        amount: 0,
        account: "Cuenta Maria",
        method: "Manual",
        notes: "",
        business: defaultType === "Botica Spa" || defaultType === "Walkme" ? defaultType : undefined
      });
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold">{income ? "Editar ingreso" : "Agregar ingreso"}</p>
        <button className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700" onClick={startVoice}>
          <Mic className="h-4 w-4" />
          Voz
        </button>
      </div>
      <p className="mb-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">{voiceStatus}</p>
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Fuente</span>
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            value={draft.source}
            onChange={(event) => update("source", event.target.value)}
            placeholder="Ej. Venta Botica Spa"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Monto</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              inputMode="decimal"
              value={draft.amount || ""}
              onChange={(event) => update("amount", Number(event.target.value))}
              placeholder="0"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Tipo</span>
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={draft.type}
              onChange={(event) => update("type", event.target.value as IncomeArea)}
            >
              {["Compartido", "Botica Spa", "Walkme", "Personal Maria", "Personal Gina", "Prestamo", "Apoyo familiar", "Reembolso", "Otro"].map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Fecha</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              type="date"
              value={draft.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Metodo</span>
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={draft.method}
              onChange={(event) => update("method", event.target.value)}
            >
              {["Manual", "Efectivo", "Transferencia", "Tarjeta", "Deposito", "Otro"].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Cuenta destino</span>
          <select
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            value={draft.account}
            onChange={(event) => update("account", event.target.value)}
          >
            {accountOptions.map((account) => (
              <option key={account.name} value={account.name}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Factura o comprobante</span>
          <input
            className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => attachFile(event.target.files?.[0])}
          />
        </label>
        {draft.attachmentName ? (
          <AttachmentPreview name={draft.attachmentName} type={draft.attachmentType ?? "pdf"} url={draft.attachmentUrl} />
        ) : null}
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Notas</span>
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-400"
            value={draft.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Notas breves"
          />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {onCancel ? (
          <button className="flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-4 font-semibold text-slate-700" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
        <button
          className={`${onCancel ? "" : "col-span-2"} flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-semibold text-white disabled:opacity-50`}
          onClick={submit}
          disabled={!draft.source.trim()}
        >
          <Save className="h-4 w-4" />
          {income ? "Guardar cambios" : "Agregar ingreso"}
        </button>
      </div>
    </Card>
  );
}

function IncomeItemCard({ income, onEdit, onDelete }: { income: Income; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{income.source}</p>
          <p className="mt-1 text-sm text-slate-500">
            {income.date} - {income.method}
          </p>
        </div>
        <p className="shrink-0 font-bold text-stable">{money.format(income.amount)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <SmallInfo icon={Wallet} label="Cuenta" value={income.account} />
        <SmallInfo icon={FileText} label="Comprobante" value={income.attachmentName ? "Adjunto" : "Sin archivo"} />
      </div>
      {income.attachmentName ? <AttachmentPreview name={income.attachmentName} type={income.attachmentType ?? "pdf"} url={income.attachmentUrl} /> : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 font-semibold text-slate-700" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </button>
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 font-semibold text-emergency" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Borrar
        </button>
      </div>
    </Card>
  );
}

function AttachmentPreview({ name, type, url }: { name: string; type: "image" | "pdf"; url?: string }) {
  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {type === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        <span className="min-w-0 truncate">{name}</span>
      </div>
      {type === "image" && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mt-3 max-h-48 w-full rounded-xl object-cover" src={url} alt={name} />
      ) : null}
      {type === "pdf" ? <p className="mt-2 text-xs text-slate-500">PDF listo para guardarse cuando conectemos almacenamiento.</p> : null}
    </div>
  );
}

function ExpenseEditor({
  expense,
  defaultType = "Casa",
  onSave,
  onCancel
}: {
  expense?: Expense;
  defaultType?: ExpenseArea;
  onSave: (expense: Expense) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Expense>(
    expense ?? {
      id: newRecordId(),
      date: "2026-05-01",
      name: "",
      amount: 0,
      type: defaultType,
      category: "",
      priority: "important",
      frequency: "once",
      paidBy: "Compartido",
      due: "2026-05-01",
      paidPersonally: false,
      notes: "",
      business: defaultType === "Botica Spa" || defaultType === "Walkme" ? defaultType : undefined
    }
  );

  function update<K extends keyof Expense>(key: K, value: Expense[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "type") {
        next.business = value === "Botica Spa" || value === "Walkme" ? value : undefined;
      }
      return next;
    });
  }

  function submit() {
    if (!draft.name.trim()) {
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      category: draft.category.trim() || "Sin categoria",
      amount: Number.isFinite(draft.amount) ? draft.amount : 0,
      business: draft.type === "Botica Spa" || draft.type === "Walkme" ? draft.type : undefined
    });
    if (!expense) {
      setDraft({
        id: newRecordId(),
        date: "2026-05-01",
        name: "",
        amount: 0,
        type: defaultType,
        category: "",
        priority: "important",
        frequency: "once",
        paidBy: "Compartido",
        due: "2026-05-01",
        paidPersonally: false,
        notes: "",
        business: defaultType === "Botica Spa" || defaultType === "Walkme" ? defaultType : undefined
      });
    }
  }

  function attachFile(file: File | undefined) {
    if (!file) {
      return;
    }
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    update("attachmentName", file.name);
    update("attachmentType", isPdf ? "pdf" : "image");
    update("attachmentUrl", isImage ? URL.createObjectURL(file) : undefined);
    update("attachmentFile", file);
  }

  return (
    <Card>
      <p className="mb-3 font-semibold">{expense ? "Editar gasto" : "Agregar gasto"}</p>
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Nombre del gasto</span>
          <input
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Ej. Renta Walkme"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Monto</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              inputMode="decimal"
              value={draft.amount || ""}
              onChange={(event) => update("amount", Number(event.target.value))}
              placeholder="0"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Area</span>
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={draft.type}
              onChange={(event) => update("type", event.target.value as ExpenseArea)}
            >
              {["Casa", "Botica Spa", "Walkme", "Compartido", "Personal Maria", "Personal Gina", "Deuda", "Suscripcion", "Emergencia", "Otro"].map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Categoria</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={draft.category}
              onChange={(event) => update("category", event.target.value)}
              placeholder="Servicios"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Prioridad</span>
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={draft.priority}
              onChange={(event) => update("priority", event.target.value as Priority)}
            >
              <option value="must_pay">Pagar si o si</option>
              <option value="important">Importante</option>
              <option value="negotiable">Negociable</option>
              <option value="pause">Pausar</option>
              <option value="eliminate">Eliminar</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Quien pago</span>
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              value={draft.paidBy}
              onChange={(event) => update("paidBy", event.target.value)}
            >
              {["Maria", "Gina", "Compartido", "Ahorros", "Tarjeta Gina", "Cuenta Botica Spa", "Cuenta Walkme", "Efectivo"].map((payer) => (
                <option key={payer} value={payer}>
                  {payer}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">Fecha limite</span>
            <input
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
              type="date"
              value={draft.due}
              onChange={(event) => update("due", event.target.value)}
            />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Frecuencia</span>
          <select
            className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
            value={draft.frequency}
            onChange={(event) => update("frequency", event.target.value as ExpenseFrequency)}
          >
            {expenseFrequencies.map((item) => (
              <option key={item} value={item}>
                {frequencyLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(draft.paidPersonally)}
            onChange={(event) => update("paidPersonally", event.target.checked)}
          />
          Es gasto de negocio pagado con dinero personal
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Factura o comprobante</span>
          <input
            className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => attachFile(event.target.files?.[0])}
          />
        </label>
        {draft.attachmentName ? (
          <AttachmentPreview name={draft.attachmentName} type={draft.attachmentType ?? "pdf"} url={draft.attachmentUrl} />
        ) : null}
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-600">Descripcion manual</span>
          <textarea
            className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-400"
            value={draft.notes ?? ""}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Ej. Ticket de super, pago de luz o gasto de proveedor"
          />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {onCancel ? (
          <button className="flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-4 font-semibold text-slate-700" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
        <button
          className={`${onCancel ? "" : "col-span-2"} flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-semibold text-white disabled:opacity-50`}
          onClick={submit}
          disabled={!draft.name.trim()}
        >
          <Save className="h-4 w-4" />
          {expense ? "Guardar cambios" : "Agregar gasto"}
        </button>
      </div>
    </Card>
  );
}

function ExpenseItemCard({ expense, onEdit, onDelete }: { expense: Expense; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{expense.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {expense.category} - {priorityLabel(expense.priority)}
          </p>
        </div>
        <p className="shrink-0 font-bold">{money.format(expense.amount)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <SmallInfo icon={UserRound} label="Pago" value={expense.paidBy} />
        <SmallInfo icon={CalendarClock} label="Fecha" value={expense.due} />
        <SmallInfo icon={Clock3} label="Frecuencia" value={frequencyLabel(expense.frequency)} />
        <SmallInfo icon={ReceiptText} label="Area" value={expense.type} />
      </div>
      {expense.paidPersonally ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-medium text-alert">Sale de dinero personal para negocio.</p>
      ) : null}
      {expense.notes ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{expense.notes}</p> : null}
      {expense.attachmentName ? (
        <AttachmentPreview name={expense.attachmentName} type={expense.attachmentType ?? "pdf"} url={expense.attachmentUrl} />
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 font-semibold text-slate-700" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </button>
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 font-semibold text-emergency" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Borrar
        </button>
      </div>
    </Card>
  );
}

function MockForm({ fields }: { fields: string[] }) {
  return (
    <Card>
      <p className="mb-3 font-semibold">Captura manual</p>
      <div className="grid gap-3">
        {fields.map((field) => (
          <label key={field} className="grid gap-1">
            <span className="text-sm font-medium text-slate-600">{field}</span>
            {field === "Notas" ? (
              <textarea className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-slate-400" placeholder="Escribe una nota breve" />
            ) : (
              <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400" placeholder={field} />
            )}
          </label>
        ))}
      </div>
      <button className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-ink px-4 font-semibold text-white">
        Guardar registro mock
      </button>
    </Card>
  );
}

function AreaFilterTabs({
  areas,
  selected,
  totals,
  onSelect
}: {
  areas: string[];
  selected: string;
  totals: Record<string, number>;
  onSelect: (area: string) => void;
}) {
  const totalAll = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {areas.map((area) => {
          const isSelected = selected === area;
          const value = area === "Todos" ? totalAll : totals[area] ?? 0;
          return (
            <button
              key={area}
              className={`min-w-[128px] rounded-2xl border p-3 text-left shadow-sm ${
                isSelected ? "border-ink bg-ink text-white" : "border-slate-100 bg-white text-ink"
              }`}
              onClick={() => onSelect(area)}
            >
              <span className={`block text-xs font-semibold ${isSelected ? "text-white/75" : "text-slate-500"}`}>{area}</span>
              <span className="mt-1 block text-lg font-bold">{money.format(value)}</span>
            </button>
          );
        })}
      </div>
      <p className="rounded-2xl bg-white p-3 text-sm text-slate-600 shadow-sm">
        Viendo: <span className="font-bold text-ink">{selected}</span>. Agregar, editar o borrar aqui solo afecta esta lista.
      </p>
    </div>
  );
}

function GoogleSheetsImportCard() {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-stable">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">Importar desde Google Sheets</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Preparado para conectar una hoja con columnas como fecha, nombre, monto, negocio, categoria, prioridad y comprobante.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <input
          className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
          placeholder="Pega aqui el link de Google Sheets"
        />
        <div className="grid grid-cols-2 gap-2">
          <button className="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700">
            Conectar
          </button>
          <button className="min-h-11 rounded-xl bg-ink px-3 text-sm font-semibold text-white">
            Importar mock
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        En esta fase es visual. Para hacerlo real conectaremos Google API o un CSV exportado de Sheets y guardaremos los archivos en Supabase Storage.
      </p>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">{text}</p>;
}

function StatusHero({ title, message, value, subvalue }: { title: string; message: string; value: string; subvalue: string }) {
  return (
    <section className="max-w-full rounded-3xl bg-ink p-5 text-white shadow-soft">
      <div className="mb-5 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-100" />
        <p className="font-semibold">{title}</p>
      </div>
      <p className="break-words text-4xl font-bold tracking-normal">{value}</p>
      <p className="mt-2 font-medium text-green-50">{subvalue}</p>
      <p className="mt-4 text-sm leading-6 text-green-50">{message}</p>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="app-surface max-w-full rounded-2xl p-4">{children}</div>;
}

function MetricCard({ label, value, tone = "default", compact = false }: { label: string; value: string; tone?: "default" | "red"; compact?: boolean }) {
  return (
    <div className={`app-surface max-w-full rounded-2xl ${compact ? "p-3" : "p-4"}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 break-words font-bold tracking-normal ${compact ? "text-xl" : "text-2xl"} ${tone === "red" ? "text-emergency" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <h2 className="text-lg font-bold">{title}</h2>
      {action ? (
        <button className="text-sm font-semibold text-slate-600" onClick={onClick}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function InsightRow({ icon: Icon, label, value, tone = "default" }: { icon: React.ElementType; label: string; value: string; tone?: "default" | "red" | "yellow" }) {
  const toneClass = tone === "red" ? "text-emergency" : tone === "yellow" ? "text-alert" : "text-ink";
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-ink">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`truncate font-bold ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
}

function AreaButton({ label, value, icon: Icon, onClick }: { label: string; value: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <button className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm" onClick={onClick}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-ink">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="text-sm text-slate-500">{value} este mes</span>
      </span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function CalmNotice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-green-900/10 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
      {text}
    </div>
  );
}

function DebtCard({ debt }: { debt: (typeof debts)[number] }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{debt.name}</p>
          <p className="text-sm text-slate-500">{debt.creditor} - vence {debt.due}</p>
        </div>
        <StatusPill label={debt.status} tone={debt.status === "Atrasada" ? "red" : "yellow"} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCard label="Total" value={money.format(debt.total)} compact />
        <MetricCard label="Pago minimo" value={money.format(debt.minimum)} compact />
      </div>
    </Card>
  );
}

function PaymentCard({ payment }: { payment: (typeof upcomingPayments)[number] }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{payment.name}</p>
          <p className="text-sm text-slate-500">{payment.type} - {payment.due}</p>
        </div>
        <p className="font-bold">{money.format(payment.amount)}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Pagado", "Negociado", "Pausado"].map((action) => (
          <button key={action} className="min-h-10 rounded-xl bg-slate-100 px-2 text-xs font-semibold text-slate-700">
            {action}
          </button>
        ))}
      </div>
    </Card>
  );
}

function AgendaBadge({ label, tone }: { label: string; tone: "red" | "strongRed" | "yellow" | "green" | "blue" | "gray" }) {
  const classes = {
    red: "bg-red-50 text-emergency",
    strongRed: "bg-red-100 text-red-800",
    yellow: "bg-amber-50 text-alert",
    green: "bg-green-50 text-stable",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-slate-200 text-slate-700"
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes[tone]}`}>{label}</span>;
}

function agendaTypeLabel(type: AgendaType) {
  const labels: Record<AgendaType, string> = {
    payment: "Pago",
    task: "Tarea",
    debt: "Deuda",
    subscription: "Suscripcion",
    reminder: "Recordatorio",
    sale: "Venta",
    pending: "Pendiente"
  };
  return labels[type];
}

function agendaAreaLabel(area: AgendaArea) {
  const labels: Record<AgendaArea, string> = {
    home: "Casa",
    maria: "Maria",
    gina: "Gina",
    shared: "Compartido",
    botica_spa: "Botica Spa",
    walkme: "Walkme"
  };
  return labels[area];
}

function agendaPriorityLabel(priority: AgendaPriority) {
  const labels: Record<AgendaPriority, string> = {
    urgent: "Urgente",
    must_pay: "Pagar si o si",
    important: "Importante",
    negotiable: "Negociable",
    pause: "Pausar",
    low: "Baja"
  };
  return labels[priority];
}

function agendaStatusLabel(status: AgendaStatus) {
  const labels: Record<AgendaStatus, string> = {
    pending: "Pendiente",
    done: "Hecho",
    paid: "Pagado",
    overdue: "Atrasado",
    negotiated: "Negociado",
    paused: "Pausado"
  };
  return labels[status];
}

function priorityTone(priority: AgendaPriority) {
  if (priority === "urgent" || priority === "must_pay") return "red";
  if (priority === "important" || priority === "negotiable") return "yellow";
  return "gray";
}

function statusTone(status: AgendaStatus) {
  if (status === "overdue") return "strongRed";
  if (status === "paid" || status === "done") return "green";
  if (status === "negotiated") return "blue";
  if (status === "paused") return "gray";
  return "gray";
}

function FollowUpCard({ item }: { item: (typeof followUps)[number] }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{item.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {item.area} - {item.owner}
          </p>
        </div>
        <StatusPill label={item.status} tone={item.status === "Contactar hoy" ? "red" : item.status === "Esperando respuesta" ? "yellow" : "green"} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <SmallInfo icon={CircleDollarSign} label="Valor" value={item.value} />
        <SmallInfo icon={Clock3} label="Siguiente" value={item.next} />
      </div>
    </Card>
  );
}

function SmallInfo({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function CrisisBlock({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "red" | "yellow" }) {
  const border = tone === "red" ? "border-red-200" : tone === "yellow" ? "border-amber-200" : "border-green-900/10";
  return (
    <div className={`rounded-2xl border ${border} bg-white p-4 shadow-sm`}>
      <p className="mb-3 font-bold">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
            <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "red" | "yellow" | "green" }) {
  const classes = {
    red: "bg-red-50 text-emergency",
    yellow: "bg-amber-50 text-alert",
    green: "bg-green-50 text-stable"
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes[tone]}`}>{label}</span>;
}

function titleFor(screen: Screen) {
  const titles: Record<Screen, string> = {
    dashboard: "Dashboard",
    incomes: "Ingresos",
    expenses: "Egresos",
    accounts: "Dinero actual",
    debts: "Deudas",
    subscriptions: "Suscripciones",
    payments: "Pagos proximos",
    agenda: "Agenda",
    pending: "Pendientes",
    budget: "Presupuesto",
    home: "Casa",
    botica: "Botica Spa",
    walkme: "Walkme",
    gina: "Gina",
    maria: "Maria",
    crisis: "Prioridades",
    planb: "Plan familiar"
  };
  return titles[screen];
}

function useTotalsShape() {
  return {
    monthIncome: 0,
    monthExpenses: 0,
    balance: 0,
    shortfall: 0,
    survivalDays: 0,
    personalBusiness: 0,
    boticaExpenses: 0,
    walkmeExpenses: 0,
    homeExpenses: 0,
    ginaExpenses: 0,
    mariaExpenses: 0,
    boticaIncome: 0,
    walkmeIncome: 0,
    weeklySalesGoal: 0,
    drainingBusiness: ""
  };
}

export default AppShell;
