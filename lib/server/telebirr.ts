/**
 * Legacy Telebirr stubs — payments now go through Chapa.
 * Re-exports kept so older imports do not break.
 */
export {
  initializeChapaPayment as createPayment,
  verifyChapaPayment,
  getPayment,
  getPaymentByTxRef,
  confirmPayment,
  simulateTelebirrCallback,
  type PaymentRecord,
} from "./chapa";
