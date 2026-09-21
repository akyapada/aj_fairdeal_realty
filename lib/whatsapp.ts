// wa.me click-to-chat — no WhatsApp Business API, no per-message cost.
// See CLAUDE.md: this is the only WhatsApp integration planned for v1.

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export function buildWhatsAppLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
