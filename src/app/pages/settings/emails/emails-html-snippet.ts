export const EMAILS_WELCOME_HTML_SNIPPET = `
<!-- ===================================================== -->
<!-- 📧 PLANTILLA: EMAIL DE BIENVENIDA (WELCOME)           -->
<!-- ===================================================== -->

<!--
MODELO DISPONIBLE:
UserPasswordResetSendEmail
-->

<!-- ===================== -->
<!-- 👤 DATOS DEL USUARIO -->
<!-- ===================== -->

{{ Name }}                <!-- Nombre del usuario -->
{{ Email }}               <!-- Correo del usuario -->
{{ Token }}               <!-- Token (si aplica, ej: activación/reset) -->

<!-- ===================== -->
<!-- 🏢 DATOS DE LA EMPRESA -->
<!-- ===================== -->

{{ Company.Name }}                <!-- Nombre comercial -->
{{ Company.TradeName }}           <!-- Nombre comercial alterno -->
{{ Company.EmailSupportEmail }}   <!-- Correo de soporte -->
{{ Company.EmailFooterText }}     <!-- Texto legal del footer -->
{{ Company.WebSite }}             <!-- Web pública -->
{{ Company.WebSiteApp }}          <!-- Web / App privada -->

<!-- ===================== -->
<!-- 🎨 BRANDING (COLORES) -->
<!-- ===================== -->

{{ Company.EmailPrimaryColor }}    <!-- Botones / CTA -->
{{ Company.EmailSecondaryColor }}  <!-- Header / Footer -->
{{ Company.EmailBackgroundColor }} <!-- Fondo general -->
{{ Company.EmailTextColor }}       <!-- Texto sobre fondo oscuro -->

<!-- ===================== -->
<!-- 🖼 IMÁGENES -->
<!-- ===================== -->

{{ Company.EmailLogoUrl }}     <!-- Logo público -->
{{ Company.EmailMascotUrl }}   <!-- Mascota / imagen decorativa -->

<!-- ===================================================== -->
<!-- 🧩 EJEMPLO DE ESTRUCTURA BÁSICA                        -->
<!-- ===================================================== -->

<table width="100%" style="background:{{ Company.EmailBackgroundColor }};padding:30px">
  <tr>
    <td align="center">

      <table width="620" style="background:#ffffff;border-radius:12px">
        <tr>
          <td align="center" style="background:{{ Company.EmailSecondaryColor }};padding:20px">
            <img src="{{ Company.EmailLogoUrl }}" style="max-width:150px">
          </td>
        </tr>

        <tr>
          <td style="padding:30px;color:#1f2937">
            <h2 style="color:{{ Company.EmailPrimaryColor }}">
              ¡Bienvenido {{ Name }}!
            </h2>

            <p>
              Gracias por registrarte en {{ Company.Name }}.
            </p>

            <a href="{{ Company.WebSiteApp }}"
               style="background:{{ Company.EmailPrimaryColor }};
                      color:{{ Company.EmailTextColor }};
                      padding:12px 24px;
                      border-radius:24px;
                      text-decoration:none;
                      display:inline-block">
              Ir a la plataforma
            </a>
          </td>
        </tr>

        <tr>
          <td align="center" style="background:{{ Company.EmailSecondaryColor }};
                                    color:{{ Company.EmailTextColor }};
                                    padding:20px">
            {{ Company.EmailFooterText }}<br>
            Soporte:
            <a href="mailto:{{ Company.EmailSupportEmail }}"
               style="color:{{ Company.EmailTextColor }}">
              {{ Company.EmailSupportEmail }}
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

<!-- ===================================================== -->
<!-- ✅ REGLAS                                              -->
<!-- ===================================================== -->
<!-- ✔ Usar solo HTML + variables -->
<!-- ✔ No usar JS -->
<!-- ✔ Usar tablas -->
<!-- ✔ Usar colores desde Company -->
<!-- ===================================================== -->
`;

export const EMAILS_RESET_PASSWORD_HTML_SNIPPET = `
<!-- ===================================================== -->
<!-- 🔐 PLANTILLA: RESET PASSWORD                          -->
<!-- ===================================================== -->

<!--
MODELO DISPONIBLE:
UserPasswordResetSendEmail
-->

<!-- ===================== -->
<!-- 👤 DATOS DEL USUARIO -->
<!-- ===================== -->

{{ Name }}     <!-- Nombre del usuario -->
{{ Email }}    <!-- Correo -->
{{ Token }}    <!-- Token único de recuperación -->

<!-- ===================== -->
<!-- 🏢 DATOS DE LA EMPRESA -->
<!-- ===================== -->

{{ Company.Name }}
{{ Company.TradeName }}
{{ Company.WebSite }}
{{ Company.WebSiteApp }}
{{ Company.EmailSupportEmail }}
{{ Company.EmailFooterText }}

<!-- ===================== -->
<!-- 🎨 BRANDING -->
<!-- ===================== -->

{{ Company.EmailPrimaryColor }}    <!-- CTA / botones -->
{{ Company.EmailSecondaryColor }}  <!-- Header / footer -->
{{ Company.EmailBackgroundColor }} <!-- Fondo general -->
{{ Company.EmailTextColor }}       <!-- Texto sobre fondos oscuros -->

<!-- ===================== -->
<!-- 🖼 IMÁGENES -->
<!-- ===================== -->

{{ Company.EmailLogoUrl }}
{{ Company.EmailMascotUrl }}

<!-- ===================================================== -->
<!-- 🧩 EJEMPLO DE ESTRUCTURA RESET PASSWORD                -->
<!-- ===================================================== -->

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:{{ Company.EmailBackgroundColor }};padding:40px 0;
              font-family:Arial,Helvetica,sans-serif">

  <tr>
    <td align="center">

      <table width="620" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:14px;overflow:hidden">

        <!-- HEADER -->
        <tr>
          <td align="center"
              style="background:{{ Company.EmailSecondaryColor }};
                     padding:24px">
            <img src="{{ Company.EmailLogoUrl }}"
                 alt="Logo"
                 style="max-width:160px">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px;color:#1f2937">

            <h2 style="margin-top:0;color:#111827">
              Recuperación de contraseña
            </h2>

            <p>
              Hola <strong>{{ Name }}</strong>,
            </p>

            <p>
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta
              en <strong>{{ Company.Name }}</strong>.
            </p>

            <p>
              Para continuar, haz clic en el siguiente botón:
            </p>

            <!-- CTA -->
            <p style="text-align:center;margin:32px 0">
              <a href="{{ Company.WebSiteApp }}/reset-password?token={{ Token }}"
                 style="background:{{ Company.EmailPrimaryColor }};
                        color:{{ Company.EmailTextColor }};
                        padding:14px 34px;
                        border-radius:30px;
                        text-decoration:none;
                        font-weight:bold;
                        display:inline-block">
                Restablecer contraseña
              </a>
            </p>

            <p style="font-size:14px;color:#6b7280">
              Este enlace es válido por un tiempo limitado.
              Si no solicitaste este cambio, puedes ignorar este mensaje.
            </p>

          </td>
        </tr>

        <!-- MASCOTA / REFUERZO VISUAL -->
        {% if Company.EmailMascotUrl %}
        <tr>
          <td align="center"
              style="background:#f9fafb;padding:20px">
            <img src="{{ Company.EmailMascotUrl }}"
                 style="max-width:90px">
          </td>
        </tr>
        {% endif %}

        <!-- FOOTER -->
        <tr>
          <td align="center"
              style="background:{{ Company.EmailSecondaryColor }};
                     color:{{ Company.EmailTextColor }};
                     padding:20px;
                     font-size:13px">

            <p style="margin:6px 0">
              {{ Company.EmailFooterText }}
            </p>

            <p style="margin:6px 0">
              ¿Necesitas ayuda?
              <a href="mailto:{{ Company.EmailSupportEmail }}"
                 style="color:{{ Company.EmailTextColor }}">
                {{ Company.EmailSupportEmail }}
              </a>
            </p>

            <p style="margin:6px 0">
              © {{ "now" | date: "%Y" }} {{ Company.Name }}
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

<!-- ===================================================== -->
<!-- ✅ REGLAS                                              -->
<!-- ===================================================== -->
<!-- ✔ Usar SOLO variables definidas -->
<!-- ✔ Token SIEMPRE en botón -->
<!-- ✔ No mostrar token en texto plano -->
<!-- ✔ Usar branding desde Company -->
<!-- ✔ HTML + tablas (compatibilidad email) -->
<!-- ===================================================== -->
`;

export const EMAILS_OPERATION_HTML_SNIPPET = `
<!-- ===================================================== -->
<!-- 💱 PLANTILLA: OPERACIONES (GENÉRICA)                   -->
<!-- ===================================================== -->

<!--
MODELO DISPONIBLE:
OperationOneEmailDTO
Sirve para:
- OPERATION_CREATED
- OPERATION_CANCELLED
- TRANSFER_RECEIVED
- TRANSFER_SENT
-->

<!-- ===================== -->
<!-- 👤 DATOS DEL CLIENTE -->
<!-- ===================== -->

{{ EProfile.Names }}                 <!-- Nombres -->
{{ EProfile.LastNamePaterno }}       <!-- Apellido paterno -->
{{ EProfile.LastNameMaterno }}       <!-- Apellido materno -->
{{ EProfile.Email }}                 <!-- Correo -->
{{ EProfile.DocumentNumber }}        <!-- Documento -->

<!-- ===================== -->
<!-- 🧾 DATOS DE OPERACIÓN -->
<!-- ===================== -->

{{ Id }}                             <!-- ID interno -->
{{ CodeOperation }}                  <!-- Código público (SC-000123) -->
{{ Status }}                         <!-- CREATED / CANCELLED / COMPLETED -->
{{ Message }}                        <!-- Motivo (cancelación u observación) -->

{{ TypeOperation }}                  <!-- 1 = USD→PEN | 2 = PEN→USD -->
{{ Monto }}                          <!-- Monto enviado -->
{{ Total }}                          <!-- Monto recibido -->
{{ TipoCambio }}                    <!-- Tipo de cambio -->
{{ Discount }}                      <!-- Descuento -->
{{ CouponCode }}                    <!-- Cupón aplicado -->

{{ DateCreation }}                  <!-- Fecha creación -->
{{ IssueDate }}                     <!-- Fecha emisión -->

<!-- ===================== -->
<!-- 🏦 CUENTA DE LA EMPRESA -->
<!-- ===================== -->

{{ CompanyBank.BankName }}
{{ CompanyBank.AccountNumber }}
{{ CompanyBank.AccountNumberCci }}
{{ CompanyBank.Titular }}
{{ CompanyBank.CoinCode }}

<!-- ===================== -->
<!-- 🏦 CUENTAS DEL CLIENTE -->
<!-- ===================== -->

{% for item in OperationBanks %}
  {{ item.ProfileBankClient2.BankName }}
  {{ item.ProfileBankClient2.AccountNumber }}
  {{ item.Amount }}
{% endfor %}

<!-- ===================== -->
<!-- 🏢 DATOS DE LA EMPRESA -->
<!-- ===================== -->

{{ Company.Name }}
{{ Company.TradeName }}
{{ Company.Ruc }}
{{ Company.WebSite }}
{{ Company.WebSiteApp }}
{{ Company.OperationTime }}          <!-- Minutos para transferir -->
{{ Company.EmailSupportEmail }}
{{ Company.EmailFooterText }}

<!-- ===================== -->
<!-- 🎨 BRANDING (EMAIL) -->
<!-- ===================== -->

{{ Company.EmailPrimaryColor }}      <!-- Botones / acciones -->
{{ Company.EmailSecondaryColor }}    <!-- Header / footer -->
{{ Company.EmailBackgroundColor }}   <!-- Fondo general -->
{{ Company.EmailTextColor }}         <!-- Texto sobre fondo oscuro -->

<!-- ===================== -->
<!-- 🖼 IMÁGENES -->
<!-- ===================== -->

{{ Company.EmailLogoUrl }}           <!-- Logo empresa -->
{{ Company.EmailMascotUrl }}         <!-- Mascota / ilustración -->

<!-- ===================== -->
<!-- 🔀 EJEMPLOS DE USO -->
<!-- ===================== -->

<!-- Mostrar moneda según tipo -->
{% if TypeOperation == "1" %}
  Envías USD {{ Monto }} y recibes PEN {{ Total }}
{% else %}
  Envías PEN {{ Monto }} y recibes USD {{ Total }}
{% endif %}

<!-- Mostrar mensaje solo si existe -->
{% if Message %}
  Motivo: {{ Message }}
{% endif %}

<!-- Mostrar cuenta CCI si existe -->
{% if CompanyBank.AccountNumberCci %}
  CCI: {{ CompanyBank.AccountNumberCci }}
{% endif %}

<!-- Mostrar bloque según estado -->
{% if Status == "CANCELLED" %}
  Operación cancelada
{% elsif Status == "COMPLETED" %}
  Operación completada
{% else %}
  Operación en proceso
{% endif %}

<!-- ===================================================== -->
<!-- ✅ REGLAS                                             -->
<!-- ===================================================== -->
<!-- ✔ Usar SOLO variables de este modelo -->
<!-- ✔ No usar JS / CSS externo -->
<!-- ✔ Usar tablas para compatibilidad email -->
<!-- ✔ Branding SIEMPRE desde Company -->
<!-- ✔ Un mismo HTML puede cubrir varios estados -->
<!-- ===================================================== -->
`;
