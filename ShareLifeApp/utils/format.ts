import { Ionicons } from "@expo/vector-icons";

/** Formate une durée en minutes en "X min" ou "Xh" ou "XhYY" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

/** Retourne l'icône Ionicons correspondant au titre d'une tâche */
export function getTaskIcon(title: string): keyof typeof Ionicons.glyphMap {
  const t = title.toLowerCase();
  if (t.includes("repas") || t.includes("dîner") || t.includes("déjeuner") || t.includes("planifier les repas")) return "restaurant-outline";
  if (t.includes("vaisselle") || t.includes("lave-vaisselle")) return "water-outline";
  if (t.includes("lessive") || t.includes("linge") || t.includes("plier")) return "shirt-outline";
  if (t.includes("aspirat")) return "ellipsis-horizontal-circle-outline";
  if (t.includes("serpillière") || t.includes("sol")) return "brush-outline";
  if (t.includes("courses")) return "cart-outline";
  if (t.includes("salle de bain") || t.includes("douche") || t.includes("lavabo")) return "sparkles-outline";
  if (t.includes("poubelle") || t.includes("recycl") || t.includes("trier")) return "trash-outline";
  if (t.includes("four") || t.includes("micro-ondes") || t.includes("cuisine")) return "flame-outline";
  if (t.includes("aérer") || t.includes("fenêtre") || t.includes("vitres") || t.includes("miroir")) return "sunny-outline";
  if (t.includes("préparer la semaine") || t.includes("calendrier")) return "calendar-outline";
  if (t.includes("planifier")) return "list-outline";
  if (t.includes("jardin") || t.includes("extérieur") || t.includes("balcon") || t.includes("plante")) return "leaf-outline";
  if (t.includes("ranger") || t.includes("désencombr") || t.includes("cave") || t.includes("garage")) return "albums-outline";
  if (t.includes("toilette") || t.includes("wc")) return "medical-outline";
  if (t.includes("serviette") || t.includes("drap")) return "bed-outline";
  if (t.includes("courrier")) return "mail-outline";
  if (t.includes("dépoussiér") || t.includes("meuble")) return "color-wand-outline";
  if (t.includes("réfrigérateur") || t.includes("frigo")) return "snow-outline";
  if (t.includes("ramasser")) return "arrow-undo-outline";
  return "checkmark-circle-outline";
}
