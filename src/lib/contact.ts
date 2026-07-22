export const WHATSAPP_NUMBER_PLACEHOLDER = "WHATSAPP_NUMBER";
export const TELEGRAM_HANDLE_PLACEHOLDER = "TELEGRAM_HANDLE";

export function getWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER_PLACEHOLDER}?text=${encodeURIComponent(message)}`;
}

export function getTelegramLink(): string {
  return `https://t.me/${TELEGRAM_HANDLE_PLACEHOLDER}`;
}
