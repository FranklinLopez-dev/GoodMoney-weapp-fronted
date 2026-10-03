export interface CompanyBanks {
  id: number,
  bankId: number,
  bankName: string,
  accountNumber: string,
  accountNumberCci: string,
  flagInter: boolean,
  status: string,
  titular: string,
  coinCode: string,
  saldo: number,
  bankIcon: string,
  type: string,
  amountMin: number,
  isFacturar: boolean
}