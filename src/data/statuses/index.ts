// import statusesJson from "./statuses.json";
// import inflictionsJson from "./inflictions.json";
// import { SimInflictionDef } from "../../types/sim/infliction";

// const statuses = statusesJson as SimInflictionDef[];
// const inflictions = inflictionsJson as SimInflictionDef[];

// export function getInflictionDef(id: string): SimInflictionDef | undefined {
//   return inflictions.find(s => s.id === id);
// }

// export function getInflictionDuration(id: string): number | undefined {
//   const def = getInflictionDef(id);
//   if (!def) throw new Error(`Unknown status id: ${id}`);
//   return def.durationFrames;
// }

// export function getStatusDef(id: string): SimStatusDef | undefined {
//   return statuses.find(s => s.id === id);
// }
