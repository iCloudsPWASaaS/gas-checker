export type PlanSeed = {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  features: string[];
  max_users: number;
  max_reports: number | null;
  sort_order: number;
  is_active: boolean;
};

export const PLAN_SEEDS: PlanSeed[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For sole gas engineers getting started.",
    monthly_price: 9.99,
    yearly_price: 99,
    currency: "GBP",
    features: [
      "Unlimited certificates",
      "Invoices & quotes",
      "Schedule & reminders",
      "Gas rate calculator",
      "Cloud backup",
    ],
    max_users: 1,
    max_reports: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "pro",
    name: "Professional",
    description: "Everything a growing heating business needs.",
    monthly_price: 19.99,
    yearly_price: 199,
    currency: "GBP",
    features: [
      "Everything in Starter",
      "Unlimited contacts",
      "Payment tracking",
      "Branded PDF certificates",
      "Priority support",
    ],
    max_users: 3,
    max_reports: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For teams of engineers and office staff.",
    monthly_price: 34.99,
    yearly_price: 349,
    currency: "GBP",
    features: [
      "Everything in Professional",
      "Up to 10 team members",
      "Company-wide reporting",
      "Dedicated onboarding",
    ],
    max_users: 10,
    max_reports: null,
    sort_order: 3,
    is_active: true,
  },
];

export const TRIAL_PLAN_ID = "pro";
