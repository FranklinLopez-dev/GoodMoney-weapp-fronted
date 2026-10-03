export type BlockingModalKind = 'maintenance' | 'closed' | 'profile';

export interface BlockingModalData {
  kind: BlockingModalKind;
  title: string;
  subtitle?: string;
  message: string;
  bullets?: string[];
  footerNote?: string;
  primaryText?: string;   
  secondaryText?: string; 
  showClose?: boolean;   
}
