export interface EmailTemplate {
  id: number;
  companyId: number;
  code: string;
  subject: string;
  htmlBody: string;
  isActive: boolean;
}