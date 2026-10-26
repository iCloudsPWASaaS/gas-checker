export type GasRateInput = {
  meter_type: "metric" | "imperial";
  reading1?: number | null;
  reading2?: number | null;
  seconds?: number | null;
};

export type GasRateResult = {
  meter_type: "metric" | "imperial";
  reading1: number | null;
  reading2: number | null;
  seconds: number;
  gas_rate_m3_hr: number;
  gross_kw: number;
  net_kw: number;
  formula: string;
};

export function calculateGasRate(input: GasRateInput): GasRateResult {
  const meterType = input.meter_type;
  const seconds = Number(input.seconds || 0);
  if (!seconds || seconds <= 0) {
    throw new Error("Seconds must be greater than zero");
  }

  const reading1 = input.reading1 === undefined || input.reading1 === null ? null : Number(input.reading1);
  const reading2 = input.reading2 === undefined || input.reading2 === null ? null : Number(input.reading2);

  let cubicFeetPerHour = 0;
  let cubicMetresPerHour = 0;

  if (meterType === "metric") {
    const used =
      reading1 !== null && reading2 !== null && reading2 >= reading1 ? reading2 - reading1 : 0.01;
    cubicMetresPerHour = (used * 3600) / seconds;
  } else {
    const used =
      reading1 !== null && reading2 !== null && reading2 >= reading1 ? reading2 - reading1 : 1;
    cubicFeetPerHour = (used * 3600) / seconds;
    cubicMetresPerHour = cubicFeetPerHour * 0.0283168;
  }

  const grossKw = cubicMetresPerHour * 10.76;
  const netKw = grossKw * 0.901;

  const round = (value: number, digits = 3) => Number(value.toFixed(digits));

  return {
    meter_type: meterType,
    reading1,
    reading2,
    seconds,
    gas_rate_m3_hr: round(cubicMetresPerHour),
    gross_kw: round(grossKw),
    net_kw: round(netKw),
    formula:
      meterType === "metric"
        ? "m³/hr = (reading 2 − reading 1) × 3600 ÷ seconds; kW = m³/hr × 10.76"
        : "ft³/hr = (reading 2 − reading 1) × 3600 ÷ seconds; m³/hr = ft³/hr × 0.0283168; kW = m³/hr × 10.76",
  };
}
