export const EMAIL_PREVIEW_MODELS: Record<string, any> = {
  OPERATION_CREATED: {
    client: {
      name: 'Juan Pérez',
      email: 'juan@mail.com'
    },
    company: {
      name: 'Good Money',
      email: 'atencion@goodmoney.pe'
    },
    operation: {
      id: 123456,
      monto: '1,000.00',
      monedaEnvio: 'USD',
      monedaRecibo: 'PEN',
      tipoCambio: '3.75'
    }
  },

  OPERATION_CANCELLED: {
    client: {
      name: 'María López'
    },
    company: {
      name: 'Good Money'
    },
    operation: {
      id: 654321,
      motivo: 'Tiempo de transferencia expirado'
    }
  }
};
