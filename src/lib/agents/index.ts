import type { ChatTurn, LlmProvider } from "../llm/provider";
import { searchProducts } from "../catalog";
import { route, type Route } from "./router";
import { lookupOrder } from "./orders";

const PERSONA = `you are big yellow, starface's smiley mascot, chatting with a customer like a warm, knowledgeable skincare friend.
style: all lowercase, playful but polished. 2 to 4 complete sentences, under 90 words. at most one emoji. end with one natural follow-up question.
substance: give concrete usage guidance (when to apply, how long to wear, what to pair it with) taken only from the catalogue entries below. name products exactly as the catalogue does, and only mention ingredients listed for that product.
never: shame anyone's skin, use words like cure, treat, heal or diagnose, compare against other brands, or paste urls (product cards are attached automatically).
starface makes cosmetics and over-the-counter acne care; for anything deep, painful or lasting, suggest chatting with a dermatologist.`;

function productSystem(message: string): string {
  const picks = searchProducts(message, 4)
    .map((p) => `- ${p.name} (${p.price}). key ingredients: ${p.keyIngredients.join(", ") || "not listed"}. ${p.description.slice(0, 500)}`)
    .join("\n");
  return `${PERSONA}\n\ncatalogue entries:\n${picks}`;
}

/** escalations are fixed copy: a human wrote and approved every word */
function escalationReply(message: string): string {
  const l = message.toLowerCase();
  if (/self[- ]?harm|hurt myself|suicid|kill myself/.test(l)) {
    return "i'm really glad you told me, and i want you to have real support right now 💛 in canada you can call or text 9-8-8 any time, and in the us you can call or text 988. if you're in immediate danger, please call 911. i'm also flagging this for a human on our team.";
  }
  if (/open (cut|wound)|infect|bleeding|pus/.test(l)) {
    return "oh no, i'm sorry you're dealing with that 💛 i can't advise on open cuts or skin that might be infected, so i'd hold off on patching it and have a doctor or dermatologist take a look. i've flagged this for our care team, and a human will follow up here if you have product questions.";
  }
  if (/pregnan|breastfeed|meds|medication|tretinoin|accutane|isotretinoin|antibiotic|prescri/.test(l)) {
    return "that's a really smart thing to check 💛 when pregnancy or medication is involved, i can't say what's safe to combine, so your doctor or dermatologist is the best person to ask. bringing the ingredient list from the product page makes that chat easy. i've also passed this to our care team so a human can follow up.";
  }
  return "i'm sorry your skin is giving you a hard time 💛 i can't advise on medical concerns, but a dermatologist can, and they're worth seeing for anything painful, spreading or lasting. i've flagged this for our care team so a human can follow up here too.";
}

export interface AgentReply { route: Route; draft: string }

export async function runAgent(message: string, history: ChatTurn[], llm: LlmProvider): Promise<AgentReply> {
  const r = route(message);
  if (r.agent === "escalation") return { route: r, draft: escalationReply(message) };
  // support answers come from a deterministic tool, not the model
  if (r.agent === "support") return { route: r, draft: lookupOrder(message) };

  const draft = await llm.complete({
    system: productSystem(message),
    messages: [...history.slice(-6), { role: "user", content: message }],
  });
  return { route: r, draft };
}
