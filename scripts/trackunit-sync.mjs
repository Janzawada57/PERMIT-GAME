// Robot GPS: Trackunit (ISO 15143-3 / AEMP 2.0) -> Firebase permitApp/vehicles
// Hasła NIGDY nie trafiają do strony – leżą tylko w GitHub Secrets.
// Prywatność: pozycja jest publikowana tylko, gdy pojazd jest w promieniu FARM_RADIUS_KM od farmy.
import crypto from "node:crypto";

const env = process.env;
const FB = (env.FIREBASE_URL || "").replace(/\/+$/, "");
const RADIUS_KM = Number(env.FARM_RADIUS_KM || 15);
const FARM = { lat: 53.2, lon: 16.5 }; // ok. środek FW Wałcz
const TU_AUTH = "https://auth.trackunit.com/token";
const TU_FLEET = "https://iris.trackunit.com/public/api/aemp/v2/15143/-3/Fleet/";

const pick = (o, k) => {
  if (!o || typeof o !== "object") return undefined;
  const kk = Object.keys(o).find(x => x.toLowerCase() === k.toLowerCase());
  return kk === undefined ? undefined : o[kk];
};
const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const km = (a, b) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const keyOf = s => String(s).replace(/[.#$\[\]\/\s]+/g, "_").slice(0, 60) || "x";

async function fbAuth() {
  if (env.FIREBASE_SECRET) return "auth=" + encodeURIComponent(env.FIREBASE_SECRET);
  if (!env.FIREBASE_SA_JSON) throw new Error("Brak sekretu FIREBASE_SECRET (albo FIREBASE_SA_JSON) w GitHub Secrets.");
  const sa = JSON.parse(env.FIREBASE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: sa.client_email, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
  });
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + sig }),
  });
  if (!r.ok) throw new Error("Google token: HTTP " + r.status);
  return "access_token=" + (await r.json()).access_token;
}

async function fbPut(path, val, auth) {
  const r = await fetch(`${FB}/permitApp/${path}.json?${auth}`, { method: "PUT", body: JSON.stringify(val) });
  if (!r.ok) throw new Error(`Firebase ${path}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
}

async function tuToken() {
  for (const k of ["TU_CLIENT_ID", "TU_CLIENT_SECRET", "TU_USERNAME", "TU_PASSWORD"])
    if (!env[k]) throw new Error(`Brak sekretu ${k} w GitHub Secrets.`);
  const r = await fetch(TU_AUTH, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${env.TU_CLIENT_ID}:${env.TU_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "password", username: env.TU_USERNAME, password: env.TU_PASSWORD, scope: "api" }),
  });
  if (!r.ok) throw new Error(`Logowanie Trackunit: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  if (!j.access_token) throw new Error("Trackunit nie zwrócił access_token");
  return j.access_token;
}

async function fleet(tok) {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const r = await fetch(TU_FLEET + page, { headers: { Authorization: "Bearer " + tok, Accept: "application/json" } });
    if ((r.status === 404 || r.status === 204) && page > 1) break;
    if (!r.ok) throw new Error(`Flota Trackunit (strona ${page}): HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
    const j = await r.json();
    const eq = arr(pick(j, "Equipment") ?? pick(pick(j, "Fleet"), "Equipment"));
    if (page === 1) console.log("Klucze odpowiedzi:", Object.keys(j).join(", "), "| klucze pojazdu:", eq[0] ? Object.keys(eq[0]).join(", ") : "-");
    all.push(...eq);
    const next = arr(pick(j, "Links")).some(l => /next/i.test(String(pick(l, "rel") || "")));
    if (!eq.length || (!next && eq.length < 100)) break;
  }
  return all;
}

function toVehicle(e) {
  const h = pick(e, "EquipmentHeader") || {};
  const loc = pick(e, "Location") || {};
  const name = String(pick(h, "EquipmentID") ?? pick(h, "EquipmentId") ?? "").trim();
  const serial = String(pick(h, "SerialNumber") ?? "").trim();
  const pin = String(pick(h, "PIN") ?? "").trim();
  const lat = Number(pick(loc, "Latitude")), lon = Number(pick(loc, "Longitude"));
  const when = Date.parse(pick(loc, "datetime") ?? pick(loc, "DateTime") ?? "") || null;
  const v = {
    name: name || serial || pin || "?", serial, pin,
    make: String(pick(h, "OEMName") ?? ""), model: String(pick(h, "Model") ?? ""),
    at: when, upd: Date.now(),
  };
  if (Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) {
    if (km(FARM, { lat, lon }) <= RADIUS_KM) { v.lat = +lat.toFixed(5); v.lon = +lon.toFixed(5); }
    else v.away = true; // poza farmą – nie publikujemy współrzędnych
  }
  return { key: keyOf(serial || pin || name), v };
}

const auth = await fbAuth();
try {
  const tok = await tuToken();
  const eq = await fleet(tok);
  const out = {};
  for (const e of eq) { const { key, v } = toVehicle(e); out[key] = v; }
  await fbPut("vehicles", out, auth);
  const n = Object.keys(out).length, onFarm = Object.values(out).filter(v => v.lat != null).length;
  await fbPut("vehiclesMeta", { upd: Date.now(), ok: true, count: n, onFarm }, auth);
  console.log(`✅ Zapisano ${n} pojazdów (na farmie: ${onFarm}).`);
} catch (err) {
  console.error("❌", err.message);
  await fbPut("vehiclesMeta", { upd: Date.now(), ok: false, err: String(err.message).slice(0, 200) }, auth).catch(() => {});
  process.exit(1);
}
