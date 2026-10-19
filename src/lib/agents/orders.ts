// Mocked order "tool". In production this would call Shopify's Admin API.
const DEMO_ORDERS: Record<string, string> = {
  "1234": "good news, order #1234 is on its way 📦 it shipped oct 16 with canada post (tracking ca123456789) and is due thursday, oct 22. if it hasn't arrived by friday, just message me here and i'll make it right. anything else i can help with?",
  "1001": "order #1001 is packed and ready to go ✨ it ships within one business day, and you'll get a tracking email the moment it's moving. need to update the address before it leaves? i can flag that for our care team right now.",
  "4242": "order #4242 was delivered on oct 14 and left at your front door 🏠 if you can't spot it, it's worth checking with neighbours or your mailroom, and if it still hasn't turned up, i'll get our care team on it right away.",
  "7777": "order #7777 is part of your subscription ⭐ your next box ships nov 2, and you can skip, swap stars or move the date anytime before then. want help with any of those?",
};

export function lookupOrder(message: string): string {
  const l = message.toLowerCase();
  const id = message.match(/#?\b(\d{3,6})\b/)?.[1];
  if (id) {
    return (
      DEMO_ORDERS[id] ??
      `hmm, i couldn't find order #${id} 🤔 could you double-check the number in your confirmation email? if it still doesn't show up, i'll loop in our care team to dig deeper.`
    );
  }
  if (/subscription|skip|swap/.test(l)) {
    return "happy to help with your subscription ⭐ you can skip a box, swap stars or change your ship date. share the order number from your last subscription email and i'll pull it up.";
  }
  if (/refund|return|damaged|wrong item/.test(l)) {
    return "so sorry it wasn't right 💛 share your order number and a quick note on what happened, and i'll get our care team moving on it today.";
  }
  return "happy to check on that! what's your order number? you'll find it in your confirmation email, starting with #.";
}
