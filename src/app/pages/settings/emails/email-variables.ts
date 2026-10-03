/** El catálogo por plantilla lo sirve el API (PENDIENTES.md #3); aquí queda solo lo que es de la UI. */

export interface GrupoVariables {
  group: string;
  variables: { name: string; description: string }[];
}

/** Bloques Liquid de uso frecuente. */
export const BLOQUES = [
  {
    nombre: 'Condición',
    plantilla: '{% if CouponCode %}\n  \n{% endif %}',
    descripcion: 'Muestra algo solo si la variable tiene valor'
  },
  {
    nombre: 'Lista de cuentas',
    plantilla: '{% for item in OperationBanks %}\n  {{ item.ProfileBankClient2.BankName }} — {{ item.Amount }}\n{% endfor %}',
    descripcion: 'Recorre las cuentas de la operación'
  },
  {
    nombre: 'Año actual',
    plantilla: '{{ "now" | date: "%Y" }}',
    descripcion: 'Para el pie de página'
  }
];
