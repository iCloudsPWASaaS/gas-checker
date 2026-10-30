export type ReportTypeDefinition = {
  id: string;
  name: string;
  category:
    | "Domestic Certificate"
    | "Commercial Certificate"
    | "Heat Pump"
    | "Oil"
    | "Continuation Pages"
    | "General";
  description?: string;
};

export const REPORT_TYPES: ReportTypeDefinition[] = [
  {
    id: "domestic-landlord-gas-safety",
    name: "Domestic/Landlord Gas Safety Certificate",
    category: "Domestic Certificate",
  },
  {
    id: "gas-breakdown-servicing",
    name: "Gas Breakdown/Servicing Record",
    category: "Domestic Certificate",
  },
  { id: "gas-warning-notice", name: "Gas Warning Notice", category: "Domestic Certificate" },
  {
    id: "gas-service-maintenance",
    name: "Gas Service/Maintenance Check List",
    category: "Domestic Certificate",
  },
  {
    id: "leisure-industry-gas-safety",
    name: "Leisure Industry Gas Safety Record",
    category: "Domestic Certificate",
  },
  {
    id: "lpg-safety-record",
    name: "Liquified Petroleum Gas Safety Record",
    category: "Domestic Certificate",
  },
  {
    id: "cooling-off-exemption",
    name: "7 Day Cooling Off Period Exemption",
    category: "Domestic Certificate",
  },
  { id: "gas-safety-record", name: "Gas Safety Record", category: "Commercial Certificate" },
  {
    id: "gas-installation-safety",
    name: "Gas Installation Safety Report",
    category: "Commercial Certificate",
  },
  {
    id: "commercial-catering-inspection",
    name: "Commercial Catering Inspection Record",
    category: "Commercial Certificate",
  },
  { id: "gas-testing-purging", name: "Gas Testing and Purging", category: "Commercial Certificate" },
  {
    id: "heat-pump-service-record",
    name: "Heat Pump Service Record",
    category: "Heat Pump",
  },
  {
    id: "heat-pump-commissioning",
    name: "Heat Pump Commissioning Record",
    category: "Heat Pump",
  },
  {
    id: "heat-pump-handover",
    name: "Heat Pump Handover Checklist",
    category: "Heat Pump",
  },
  {
    id: "domestic-oil-service-record",
    name: "Domestic Oil Service Record",
    category: "Oil",
  },
  {
    id: "domestic-oil-tank-inspection",
    name: "Domestic Oil Tank Inspection",
    category: "Oil",
  },
  {
    id: "commercial-oil-service-record",
    name: "Commercial Oil Service Record",
    category: "Oil",
  },
  {
    id: "continuation-comments",
    name: "Continuation for General Comments",
    category: "Continuation Pages",
  },
  {
    id: "continuation-appliances",
    name: "Continuation for Appliances and Defects",
    category: "Continuation Pages",
  },
  { id: "job-sheet", name: "Job Sheet", category: "General" },
  { id: "commissioning", name: "Commissioning", category: "General" },
  { id: "cdi-oil", name: "CDII Oil", category: "General" },
  { id: "miscellaneous-record", name: "Miscellaneous Record", category: "General" },
];

export function reportTypeName(id: string) {
  return REPORT_TYPES.find((item) => item.id === id)?.name || id;
}
