export const sentences = (text: string) =>
  text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

export const DERM_DISCLAIMER = "for anything deep, painful or lasting, chat w a dermatologist 💛";
