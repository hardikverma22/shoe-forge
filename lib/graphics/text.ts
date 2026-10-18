/** Renders a short text label to a transparent PNG data URL. Waits for the font first. */
export async function textToDataUrl(
  text: string,
  fontFamily: string,
  color: string,
  condensed = false,
): Promise<string> {
  const font = `900 180px ${fontFamily}`;
  const stretch: CanvasFontStretch = condensed ? "condensed" : "normal";
  if (document.fonts?.load) await document.fonts.load(font, text);
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.font = font;
  ctx.fontStretch = stretch;
  const width = Math.ceil(ctx.measureText(text).width) + 48;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(64, width);
  canvas.height = 240;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Canvas is not available");
  c.font = font;
  c.fontStretch = stretch;
  c.fillStyle = color;
  c.textBaseline = "middle";
  c.textAlign = "center";
  c.fillText(text, canvas.width / 2, canvas.height / 2 + 6);
  return canvas.toDataURL("image/png");
}

/** The family and width for a text graphic's font choice ("display" is Archivo condensed). */
export function fontFor(choice: string | undefined): { family: string; condensed: boolean } {
  const family =
    (typeof document !== "undefined" &&
      getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim()) ||
    "sans-serif";
  return { family, condensed: choice !== "sans" };
}
