import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Edit this to your actual institution name/letterhead text.
const INSTITUTION_NAME = "Giftflow University";

interface LetterInput {
  requestId: string;
  donorName: string;
  giftTitle: string;
  giftType?: string | null;
  amount?: number | null;
  currency?: string | null;
  purpose?: string | null;
  department?: string | null;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates a formal appreciation letter PDF for an approved gift, saves it
 * to public/uploads (same storage location as every other upload in this
 * app), and returns the URL to serve it from.
 */
export async function generateAppreciationLetter(input: LetterInput): Promise<string> {
  const {
    requestId,
    donorName,
    giftTitle,
    giftType,
    amount,
    currency,
    purpose,
    department,
  } = input;

  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter, points
  const { width, height } = page.getSize();

  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);

  const margin = 72; // 1 inch
  const maxWidth = width - margin * 2;
  let y = height - margin;

  const drawLine = (text: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
    const size = opts.size ?? 11;
    const useFont = opts.bold ? boldFont : font;
    page.drawText(text, { x: margin, y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
    y -= (opts.gap ?? size + 6);
  };

  const drawParagraph = (text: string, size = 11, lineGap = 16) => {
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: margin, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineGap;
    }
    y -= 6; // extra space after paragraph
  };

  // Letterhead
  drawLine(INSTITUTION_NAME, { size: 16, bold: true, gap: 24 });
  drawLine(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    { size: 10, gap: 28 }
  );

  // Salutation
  drawLine(`Dear ${donorName},`, { size: 12, gap: 22 });

  const giftDescription = giftType ? giftType.toLowerCase() : "gift";
  const amountClause =
    amount !== null && amount !== undefined
      ? ` in the amount of ${currency || "NGN"} ${amount.toLocaleString()}`
      : "";
  const sourceClause = department ? ` through ${department}` : "";

  drawParagraph(
    `On behalf of ${INSTITUTION_NAME}, it is with great pleasure that we formally acknowledge and express our sincere gratitude for your generous ${giftDescription} titled "${giftTitle}"${amountClause}, submitted${sourceClause}.`
  );

  if (purpose) {
    drawParagraph(`This gift has been designated to support the following: ${purpose}`);
  }

  drawParagraph(
    `Your contribution has been formally reviewed and approved through our institutional governance process. Gifts such as yours make a meaningful and lasting impact, and we are deeply grateful for your continued partnership and generosity.`
  );

  drawParagraph(`Please accept our warmest thanks on behalf of the entire university community.`);

  y -= 12;
  drawLine("Sincerely,", { size: 11, gap: 40 });
  drawLine("University Council", { size: 11, bold: true, gap: 16 });
  drawLine(INSTITUTION_NAME, { size: 11 });

  const pdfBytes = await doc.save();

  const uploadDir = path.join(process.cwd(), "public", "uploads", "letters");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `appreciation-letter-${requestId}-${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, pdfBytes);

  return `/uploads/letters/${fileName}`;
}