export interface PaymentConditions {
  id: number;
  code: string;
  description: string;
  status: string;
  isDefault: boolean; 
  refSunat: string;
}