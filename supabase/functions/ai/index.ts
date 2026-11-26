// We're Cooked AI helper. Signed-in users only (JWT verified by Supabase).
// Modes:
//   pantry_photo  {image|images[], media_type}   -> {items:[{name,qty,unit,category,expires_days}]}
//   receipt_photo {image|images[], media_type}   -> same shape, from a grocery receipt (up to 4 photos of one receipt)
//   recipe_photo  {image, media_type}            -> {recipe:{...}}
//   recipe_url    {url}                          -> {recipe:{...}}  (schema.org first, AI fallback)
//   generate      {pantry:[...], dislikes, servings, wish} -> {recipes:[...]}
//   recipe_voice  {transcript}                   -> {recipe:{...}, estimated:[string]}
//   bar_photo     {image|images[], media_type}   -> {bottles:[{name,category,abv,size_ml,fill}]}  (Back Home Bar)
//   spec_voice    {transcript}                   -> {spec:{...}}  (Back Home Bar)
//   spec_photo    {image, media_type}            -> {spec:{...}}  (Back Home Bar)
//   bartender     {question, history, bar, preps, can_make, units} -> {answer, drinks:[string]}  (Back Home Bar)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MODEL = "claude-sonnet-5-5";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const CATS = "Produce, Meat & Seafood, Dairy & Eggs, Bakery, Pantry, Spices, Frozen, Drinks, Snacks, Household, Other";
const SPEC_SHAPE = `{"name":string,"family":"Sour|Old Fashioned|Manhattan|Martini|Highball|Fizz|Tiki|Champagne|Spritz|Julep|Swizzle|Cobbler|Sling|Flip|Punch|Hot|Duo|Other","glass":string,"ice":string,"method":"shaken|stirred|built|swizzled|flash-blended|blended|rolled|thrown","garnish":string,"ingredients":[{"qty":number|null,"unit":"oz|ml|dash|barspoon|tsp|drops|leaves|whole|rinse|top","name":string}],"notes":string}`;
const BAR_CATS = "Gin, Genever, Vodka, Rum, Tequila, Mezcal, Whiskey, Brandy, Liqueur, Anise, Amaro, Vermouth, Fortified wine, Bitters, Other spirits, Wine & beer, Mixers";
const RECIPE_SHAPE = `{"title":string,"servings":number,"time_min":number|null,"category":"breakfast|main|side|soup|salad|appetizer|dessert|bread|drink|sauce|seasoning|dressing|condiment","kind":"meal|component","tags":[string],"ingredients":[{"qty":number|null,"unit":string,"name":string}],"steps":[string],"notes":string}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function claude(content: unknown[], system: string, maxTokens = 4000) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("NO_KEY");
  let r: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
    });
    if (r.ok || ![429, 500, 502, 503, 529].includes(r.status)) break;
    await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
  }
  if (!r!.ok) { const t = (await r!.text()).slice(0, 400); console.error("anthropic error", r!.status, t); throw new Error(r!.status === 400 && /image/i.test(t) ? "That photo couldn't be read. Try a clearer, closer photo." : `AI service error ${r!.status}. Try again in a moment.`); }
  const d = await r!.json();
  const text = (d.content || []).map((c: { text?: string }) => c.text || "").join("").replace(/```(?:json)?/g, "");
  const a = text.indexOf("{"), z = text.lastIndexOf("}");
  if (a < 0 || z <= a) { console.error("no json", d.stop_reason, text.slice(0, 300)); throw new Error("The AI did not return a usable answer. Try again."); }
  try { return JSON.parse(text.slice(a, z + 1)); }
  catch (e) {
    // a long answer cut off mid-list: keep the complete items
    const cut = text.slice(a); const lastObj = cut.lastIndexOf("}");
    for (let k = lastObj; k > 0; k = cut.lastIndexOf("}", k - 1)) { try { return JSON.parse(cut.slice(0, k + 1) + "]}"); } catch (_) { /* keep trimming */ } if (lastObj - k > 4000) break; }
    console.error("bad json", d.stop_reason, (e as Error).message, text.slice(0, 300));
    throw new Error("The AI's answer was garbled. Try again.");
  }
}

const img = (b64: string, mt: string) => ({ type: "image", source: { type: "base64", media_type: mt || "image/jpeg", data: b64 } });

// ---- schema.org Recipe extraction (no AI needed for most recipe sites)
function isoMin(s?: string) {
  if (!s) return null;
  const m = s.match(/P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return null;
  const v = (Number(m[1] || 0) * 60) + Number(m[2] || 0);
  return v || null;
}
function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const n of node) { const f = findRecipe(n); if (f) return f; } return null; }
  const o = node as Record<string, unknown>;
  const t = o["@type"];
  if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) return o;
  if (o["@graph"]) return findRecipe(o["@graph"]);
  return null;
}
function stepsOf(x: unknown): string[] {
  if (!x) return [];
  if (typeof x === "string") return x.split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (Array.isArray(x)) return x.flatMap(s => typeof s === "string" ? [s] : (s as Record<string, unknown>).itemListElement ? stepsOf((s as Record<string, unknown>).itemListElement) : [String((s as Record<string, unknown>).text || (s as Record<string, unknown>).name || "")]).map(s => s.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const b = await req.json();
    const mode = b.mode as string;

    if (mode === "pantry_photo" || mode === "receipt_photo") {
      const pics: string[] = (Array.isArray(b.images) && b.images.length ? b.images : [b.image]).filter(Boolean).slice(0, 4);
      if (!pics.length) return json({ error: "No photo came through. Try again." }, 400);
      const what = mode === "receipt_photo"
        ? "This is a receipt. Read the store or restaurant name, the purchase date and the final total paid (the TOTAL / BALANCE DUE line after tax and discounts, not the subtotal). Say whether it's a grocery or household store (groceries), a sit-down restaurant (out) or takeout/delivery/fast food (takeout). For a store receipt, list each food or household item bought, expanding abbreviations into plain names (e.g. 'GV WHL MLK GAL' -> 'whole milk'), with the quantity bought. For a restaurant receipt, leave items empty."
        : "This is a photo of a pantry, fridge, freezer or groceries. List every distinct food item you can identify with reasonable confidence, with an estimated count or amount.";
      const multi = pics.length > 1 ? `These ${pics.length} photos are consecutive parts of the same ${mode === "receipt_photo" ? "receipt, top to bottom; items may repeat where the photos overlap, so list each purchased line once" : "kitchen"}.\n` : "";
      const out = await claude([...pics.map(p => img(p, b.media_type)), { type: "text", text: `${multi}${what}\nReturn only JSON: {${mode === "receipt_photo" ? '"store":string|null,"date":"YYYY-MM-DD"|null,"total":number|null,"kind":"groceries|out|takeout",' : ""}"items":[{"name":string (short, lowercase, singular where natural),"qty":number,"unit":string ("" for countable items, or lb, oz, gal, qt, cup, bag, box, can, jar, bottle, bunch, dozen),"category":one of ${CATS},"expires_days":number|null (typical days until it should be used, for fresh food only)}]}` }],
        "You help a family keep their kitchen inventory. Be practical and don't invent items you can't see.", 8000);
      return json(out);
    }

    if (mode === "bar_photo") {
      const pics: string[] = (Array.isArray(b.images) && b.images.length ? b.images : [b.image]).filter(Boolean).slice(0, 4);
      if (!pics.length) return json({ error: "No photo came through. Try again." }, 400);
      const styles = (Array.isArray(b.styles) ? b.styles : []).slice(0, 400).join("\n");
      const multi = pics.length > 1 ? `These ${pics.length} photos show different parts of the same home bar; list each bottle once.\n` : "";
      const out = await claude([...pics.map(p => img(p, b.media_type)), { type: "text", text: `${multi}This is a home bar shelf, a liquor cabinet or bottle labels. List every bottle of spirits, liqueur, amaro, vermouth, bitters, wine or mixer you can identify.

For each bottle, read the label like an inventory clerk:
- "brand": the producer exactly as printed (e.g. "Smith & Cross", "Rittenhouse", "Carpano").
- "name": the full specific product: brand + expression + age or proof statement as printed (e.g. "Rittenhouse Rye Bottled in Bond", "Appleton Estate 12 Rare Casks", "Hennessy VSOP", "Del Maguey Vida"). Never return just a category like "rum", "bourbon" or "gin"; if you can't read the brand, skip that bottle.
- "style_id": the closest style id from the list below (use the label's details: bottled-in-bond, cask strength, añejo, VSOP, peated Islay, agricole, etc.). Leave it empty only if nothing fits.
- "style_hint": a few words describing the style in your own words (e.g. "bottled-in-bond rye", "high-ester Jamaican pot still rum").
- "abv" from the label if visible, "size_ml" if printed, and "fill": how full it looks from the liquid line (1 = full, 0.5 = half).
Skip anything you can't read with reasonable confidence; don't guess brands.

STYLES (id|category|name):
${styles}

Return only JSON: {"bottles":[{"brand":string,"name":string,"style_id":string,"style_hint":string,"category":one of ${BAR_CATS},"abv":number|null,"size_ml":number|null,"fill":number}]}` }],
        "You are a veteran bartender doing inventory on a home bar. You read labels precisely, down to the expression and proof, and never invent bottles you can't see.", 8000);
      return json(out);
    }

    if (mode === "bartender") {
      const q = String(b.question || "").trim().slice(0, 2000);
      if (!q) return json({ error: "Ask me something." }, 400);
      const hist = (Array.isArray(b.history) ? b.history : []).slice(-8).map((h: { role: string; text: string }) => `${h.role === "user" ? "Guest" : "You"}: ${String(h.text).slice(0, 1500)}`).join("\n");
      const bar = (Array.isArray(b.bar) ? b.bar : []).slice(0, 250).join("; ");
      const can = (Array.isArray(b.can_make) ? b.can_make : []).slice(0, 150).join(", ");
      const out = await claude([{ type: "text", text: `THEIR BACK BAR: ${bar || "(empty so far)"}
HOUSE PREPS ON HAND: ${(b.preps || []).join(", ") || "none"}
SPECS THEY CAN MAKE RIGHT NOW (from their app): ${can || "none yet"}
UNITS: ${b.units === "ml" ? "milliliters" : "ounces"}
${hist ? `CONVERSATION SO FAR:\n${hist}\n` : ""}
GUEST ASKS: ${q}

Answer like you're talking across the bar: warm, direct, a little dry, generous with the why. Keep it tight (under 170 words) unless they ask for a full menu or a lesson. Use what's on their shelf first and name their actual bottles. When you give a spec, put each ingredient on its own line with amounts in their units, then the method in one line. Fixes are specific ("add a quarter ounce of lime"). If they lack something, give the best substitute from their shelf, then what to buy. Plain text only: no markdown headers, no asterisks.
Also list in "drinks" the exact names of any classic cocktails you recommend (e.g. "Last Word", "Paper Plane"), so the app can link them.
Return only JSON: {"answer":string,"drinks":[string]}` }],
        "You are a head bartender with 25 years behind the stick in New York City craft cocktail bars. You teach home bartenders to drink and mix like pros: precise specs, classic technique, honest opinions, no snobbery. You never invent cocktail history.", 1500);
      return json(out);
    }

    if (mode === "spec_voice") {
      const t = String(b.transcript || "").trim().slice(0, 8000);
      if (t.length < 8) return json({ error: "I didn't catch enough of that. Try describing the drink again." }, 400);
      const out = await claude([{ type: "text", text: `A professional bartender described a cocktail spec out loud. This is the speech-to-text transcript, so expect filler words and mis-heard names (e.g. "chart truce" is Chartreuse, "peh shows" is Peychaud's, "car piano" is Carpano).

TRANSCRIPT:
"""${t}"""

Write it up as a clean spec card. Keep their exact amounts (convert spoken fractions: "three quarters" = 0.75 oz, "a bar spoon" = 1 barspoon). Name ingredients generically by style unless they name a specific brand that matters (e.g. "rye whiskey", "sweet vermouth", "Green Chartreuse", "lime juice", "simple syrup", "Angostura bitters"). Don't add ingredients they didn't say. Put technique tips in notes.
Return only JSON: {"spec":${SPEC_SHAPE}}` }], "You transcribe bartenders' specs exactly. You never invent ingredients.", 2500);
      return json(out);
    }

    if (mode === "spec_photo") {
      const out = await claude([img(b.image, b.media_type), { type: "text", text: `Transcribe the cocktail spec in this photo (a menu, a recipe card, a book page or handwriting). Keep the quantities as written, converting cl or ml to oz only if the spec is in oz elsewhere. If several drinks are shown, take the most prominent one. Return only JSON: {"spec":${SPEC_SHAPE}}` }],
        "You transcribe cocktail specs faithfully.", 2500);
      return json(out);
    }

    if (mode === "recipe_photo") {
      const out = await claude([img(b.image, b.media_type), { type: "text", text: `Transcribe the recipe in this photo (it may be handwritten or a screenshot). Keep the cook's quantities and wording; fix obvious spelling. If a step list is missing, leave steps empty rather than inventing them. Return only JSON: {"recipe":${RECIPE_SHAPE}}` }],
        "You transcribe family recipes faithfully.");
      return json(out);
    }

    if (mode === "recipe_url") {
      const url = String(b.url || "");
      if (!/^https?:\/\//i.test(url)) return json({ error: "That doesn't look like a web link." }, 400);
      const page = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (WereCooked recipe saver)" } });
      const html = await page.text();
      for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          const r = findRecipe(JSON.parse(m[1].trim()));
          if (r) {
            const ingr = (r.recipeIngredient as string[] || []).map(s => s.replace(/<[^>]+>/g, "").trim());
            const y = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
            return json({ recipe: { title: String(r.name || "Saved recipe"), servings: parseInt(String(y || "4")) || 4, time_min: isoMin(r.totalTime as string) || isoMin(r.cookTime as string), ingredients_text: ingr, steps: stepsOf(r.recipeInstructions), source_url: url, notes: "" } });
          }
        } catch (_) { /* try next block */ }
      }
      const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 30000);
      const out = await claude([{ type: "text", text: `Extract the main recipe from this web page text. Return only JSON: {"recipe":${RECIPE_SHAPE}}\n\nPAGE:\n${text}` }], "You extract recipes from web pages accurately.");
      if (out.recipe) out.recipe.source_url = url;
      return json(out);
    }

    if (mode === "recipe_voice") {
      const t = String(b.transcript || "").trim().slice(0, 12000);
      if (t.length < 8) return json({ error: "I didn't catch enough of that. Try describing the dish again." }, 400);
      const out = await claude([{ type: "text", text: `Someone described a recipe out loud. This is the speech-to-text transcript, so expect filler words, run-on sentences, restarts and mis-heard words (for example "row tell" is Rotel, "vel vita" is Velveeta).

TRANSCRIPT:
"""${t}"""

Turn it into a clean recipe card:
- Use the dish name they say; if they never name it, give it a plain descriptive name.
- Include every ingredient they mention, with the amounts they give. Keep their own measurements and words (a "stick" of butter, a "can" of Rotel, a "big spoonful") converted to standard units only where obvious (1 stick butter = 1/2 cup).
- Where they don't give an amount, estimate a typical amount for a Southern home cook and the servings, and list that ingredient in "estimated".
- Steps: use their method and order, rewritten as short clear steps. Keep their tips, temperatures and times. If they describe no method, write brief sensible steps and add "steps" to "estimated".
- Don't add ingredients they didn't mention, except salt, pepper or cooking oil when the method clearly needs them (list those in "estimated").
- Put any stories, tips or "my mama always..." asides in notes, in their words.
Return only JSON: {"recipe":${RECIPE_SHAPE},"estimated":[string]}` }],
        "You turn a family cook's spoken description into an accurate, faithful recipe. You never invent dishes or ingredients they didn't describe.", 4000);
      return json(out);
    }

    if (mode === "generate") {
      const pantry = (b.pantry || []).slice(0, 200).join(", ");
      const out = await claude([{ type: "text", text: `Our kitchen has: ${pantry || "(nothing listed)"}.\nUse-soon items: ${(b.use_soon || []).join(", ") || "none"}.\nAvoid: ${b.dislikes || "nothing"}.\nServings: ${b.servings || 4}.\n${b.wish ? "We're in the mood for: " + b.wish + "\n" : ""}Suggest 3 different dinners we can make mostly from what we have (assume salt, pepper, oil, butter, flour and sugar). Favor Southern home cooking, use the use-soon items first, and keep missing ingredients to a minimum. Return only JSON: {"recipes":[${RECIPE_SHAPE} plus "missing":[string]]}` }],
        "You are a practical Southern home cook helping a family decide what's for dinner.", 6000);
      return json(out);
    }

    return json({ error: "Unknown mode" }, 400);
  } catch (e) {
    const msg = (e as Error).message;
    console.error("ai failed:", msg);
    if (msg === "NO_KEY") return json({ error: "AI features aren't switched on yet. Add an ANTHROPIC_API_KEY secret in Supabase (Edge Functions › Secrets).", code: "NO_KEY" }, 503);
    return json({ error: msg }, 500);
  }
});
