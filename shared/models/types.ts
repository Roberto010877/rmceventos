/**
 * Tipo genérico para fechas de Firebase
 * Puede ser un Date (en el cliente antes de guardar) o un objeto con seconds y nanoseconds (desde Firestore)
 */
export type FirebaseTimestamp = Date | { seconds: number; nanoseconds: number };
