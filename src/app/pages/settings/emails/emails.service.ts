import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EmailTemplate } from "src/app/core/models/settings/email.model";
import { environment } from "src/environments/environment";
import { GrupoVariables } from "./email-variables";

@Injectable({ providedIn: 'root' })
export class EmailsService {

  private baseUrl = `${environment.apiUrl}/api/email-templates`;

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<EmailTemplate[]>(`${this.baseUrl}`);
  }

  create(data: Partial<EmailTemplate>) {
    return this.http.post<EmailTemplate>(this.baseUrl, data);
  }

  update(id: number, data: Partial<EmailTemplate>) {
    return this.http.put(`${this.baseUrl}/${id}`, data, { responseType: 'text' });
  }

  preview(htmlBody: string) {
    return this.http.post<{ html: string }>(
      `${this.baseUrl}/preview`,
      { htmlBody }
    );
  }

  sendPreviewEmail(templateCode: string, htmlBody: string, toEmail: string) {
    return this.http.post(
      `${this.baseUrl}/send-preview`,
      { templateCode, htmlBody, toEmail },
      { responseType: 'text' }
    );
  }

  /** El catálogo de variables por código de plantilla lo sirve el API. */
  getVariables(code: string) {
    return this.http.get<GrupoVariables[]>(`${this.baseUrl}/variables`, { params: { code } });
  }

}
