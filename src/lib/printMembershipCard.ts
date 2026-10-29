export const MEMBERSHIP_CARD_ASPECT_RATIO = "1586 / 992";

/** Prepare a separate print document so neither the dashboard nor its 3D flip is printed. */
export async function prepareMembershipCardPrint(source: HTMLElement, title: string): Promise<HTMLIFrameElement> {
  const frame = document.createElement("iframe");
  frame.title = "Membership card print preview";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;height:700px;border:0;";
  document.body.appendChild(frame);

  const printDocument = frame.contentDocument;
  if (!printDocument) {
    frame.remove();
    throw new Error("Unable to open the card print document.");
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    printDocument.title = title;
    printDocument.documentElement.lang = document.documentElement.lang || "en";
    const base = printDocument.createElement("base");
    base.href = document.baseURI;
    printDocument.head.appendChild(base);

    const stylesReady = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((node) => {
      const copy = node.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;
      const ready = copy instanceof HTMLLinkElement
        ? new Promise<void>((resolve, reject) => {
            copy.addEventListener("load", () => resolve(), { once: true });
            copy.addEventListener("error", () => reject(new Error("Unable to load card print styles.")), { once: true });
          })
        : Promise.resolve();
      printDocument.head.appendChild(copy);
      return ready;
    });

    const style = printDocument.createElement("style");
    style.textContent = `
      @page { size: A4 portrait; margin: 15mm; }
      html, body { margin: 0 !important; padding: 0 !important; background: white !important; color-scheme: light; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      #membership-card-print { width: 85.6mm; display: grid; gap: 8mm; }
      [data-card-face] { width: 85.6mm; height: 53.54mm; container-type: inline-size; break-inside: avoid; }
      [data-card-face] > div { box-shadow: none !important; }
    `;
    printDocument.head.appendChild(style);

    const cards = source.cloneNode(true) as HTMLElement;
    cards.id = "membership-card-print";
    // The source is offscreen on the dashboard; its cloned document uses ordinary flow.
    cards.removeAttribute("style");
    cards.removeAttribute("aria-hidden");
    printDocument.body.appendChild(cards);

    const assetsReady = (async () => {
      await Promise.all(stylesReady);
      await printDocument.fonts.ready;
      await Promise.all(Array.from(cards.querySelectorAll("img"), (image) => image.decode()));
    })();
    await Promise.race([
      assetsReady,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Card images or fonts took too long to load. Please try again.")), 20000);
      }),
    ]);
    return frame;
  } catch (error) {
    frame.remove();
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
