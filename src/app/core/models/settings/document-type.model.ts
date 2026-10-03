export interface DocumentType {
  id: number;
  name: string;          
  code: string;          
  codeSBS?: string | null;
  sizeMin: number;       
  sizeMax: number;       
  isExact: boolean;      
  isNumeric: boolean;   
  isNatural: boolean;  
  isDefault: boolean;   
  status: string;      
}