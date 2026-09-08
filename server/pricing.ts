import type { DeliveryOption } from './models';

const multipliers: Record<DeliveryOption, number> = {
  standard: 1,
  express: 1.45,
  same_day: 2.2,
  premium_overnight: 2.8,
};

const baseByTransport = { road: 14, air: 28, sea: 42 } as const;

export const isAfterDropoffCutoff = (date = new Date()) => {
  const cutoff = new Date(date);
  cutoff.setHours(17, 30, 0, 0);
  return date.getTime() > cutoff.getTime();
};

export const suggestPackaging = (length: number, width: number, height: number, weight: number, fragile = false) => {
  const volume = length * width * height;
  if (fragile || weight > 25 || volume > 10000) return weight > 80 ? 'pallet' : 'custom_crate';
  if (volume < 900 && weight < 2) return 'envelope';
  return 'box';
};

export const calculateQuote = (input: {
  length: number;
  width: number;
  height: number;
  weight: number;
  deliveryOption: DeliveryOption;
  transport: 'road' | 'air' | 'sea';
  international: boolean;
}) => {
  const dimensionalWeight = (input.length * input.width * input.height) / 139;
  const billableWeight = Math.max(input.weight, dimensionalWeight);
  const distanceMultiplier = input.international ? 1.8 : 1;
  const subtotal = (baseByTransport[input.transport] + billableWeight * 1.65) * multipliers[input.deliveryOption] * distanceMultiplier;
  const fuelSurcharge = subtotal * 0.08;
  const total = Math.round((subtotal + fuelSurcharge) * 100) / 100;

  return {
    currency: 'USD',
    billableWeight: Math.round(billableWeight * 100) / 100,
    suggestedPackaging: suggestPackaging(input.length, input.width, input.height, input.weight),
    subtotal: Math.round(subtotal * 100) / 100,
    fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
    total,
    cutoffPassed: isAfterDropoffCutoff(),
  };
};
