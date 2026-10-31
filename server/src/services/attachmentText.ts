import ExcelJS from 'exceljs';
import mammoth from 'mammoth';
import path from 'path';
import { Readable } from 'stream';
import { config, isGeminiConfigured } from '../config';
import { getGeminiClient } from './embeddingService';

const MAX_TEXT_CHARS = 40000;

export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png',
]);

const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export function cleanText(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const v = value as any;
    if (v.result !== undefined) return cellToText(v.result);
    if (v.text !== undefined) return String(v.text);
    if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text).join('');
    return '';
  }
  return String(value);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');
  const parsed = await pdfParse(buffer);
  return parsed.text || '';
}

async function extractSpreadsheet(buffer: Buffer, ext: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  if (ext === '.csv') {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer as any);
  }
  const lines: string[] = [];
  workbook.eachSheet((sheet) => {
    lines.push(`Sheet: ${sheet.name}`);
    sheet.eachRow((row) => {
      const cells = (row.values as ExcelJS.CellValue[]).slice(1).map(cellToText).map((c) => c.trim());
      if (cells.some((c) => c.length > 0)) {
        lines.push(cells.join(' | '));
      }
    });
  });
  return lines.join('\n');
}

async function extractWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
  const client = getGeminiClient();
  if (!client || buffer.length > 12 * 1024 * 1024) return '';
  try {
    const response = await client.models.generateContent({
      model: config.geminiModel,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: buffer.toString('base64') } },
            { text: 'Transcribe all readable text from this college document exactly as written. Output only the text.' },
          ],
        },
      ],
    });
    return response.text || '';
  } catch (err: any) {
    console.warn('[AttachmentText] Gemini text extraction failed:', err.message);
    return '';
  }
}

export async function extractAttachmentText(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  try {
    let text = '';
    if (ext === '.pdf') {
      text = await extractPdf(buffer);
      if (cleanText(text).length < 40 && isGeminiConfigured()) {
        text = await extractWithGemini(buffer, 'application/pdf');
      }
    } else if (ext === '.docx') {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else if (ext === '.xlsx' || ext === '.csv') {
      text = await extractSpreadsheet(buffer, ext);
    } else if (ext === '.txt') {
      text = buffer.toString('utf8');
    } else if (IMAGE_MIME[ext] && isGeminiConfigured()) {
      text = await extractWithGemini(buffer, IMAGE_MIME[ext]);
    }
    return cleanText(text);
  } catch (err: any) {
    console.warn(`[AttachmentText] Could not read text from ${originalName}:`, err.message);
    return '';
  }
}
