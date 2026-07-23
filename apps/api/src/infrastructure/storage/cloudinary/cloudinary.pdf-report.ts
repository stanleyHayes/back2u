import { inject, injectable } from 'inversify';
import { v2 as cloudinary } from 'cloudinary';
import PDFDocument from 'pdfkit';

import type { ILogger, IPdfReportService } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

type ReportInput = {
  item: { title: string; description: string; serialNumber?: string; imei?: string; place: string; occurredAt: Date };
  user: { name: string; email: string; phone?: string };
};

@injectable()
export class PdfKitReportService implements IPdfReportService {
  private readonly enabled: boolean;

  constructor(
    @inject(TOKENS.Env) env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    this.enabled = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
    if (this.enabled) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME!,
        api_key: env.CLOUDINARY_API_KEY!,
        api_secret: env.CLOUDINARY_API_SECRET!,
      });
    }
  }

  async buildStolenItemReport(input: ReportInput): Promise<{ url: string }> {
    const pdf = await this.render(input);
    if (!this.enabled) {
      this.logger.info('pdf report noop (no Cloudinary keys)', {
        bytes: pdf.byteLength,
        title: input.item.title,
      });
      return { url: `local://stolen-item-report/${encodeURIComponent(input.item.title)}.pdf` };
    }
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'police-reports', resource_type: 'raw', format: 'pdf' },
        (err, res) => (err || !res ? reject(err ?? new Error('cloudinary upload failed')) : resolve(res)),
      );
      stream.end(pdf);
    });
    return { url: result.secure_url };
  }

  private render(input: ReportInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Back2u — Stolen Item Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown();

      doc.fontSize(14).text('Item');
      doc.fontSize(12);
      doc.text(`Title: ${input.item.title}`);
      doc.text(`Description: ${input.item.description}`);
      if (input.item.serialNumber) doc.text(`Serial number: ${input.item.serialNumber}`);
      if (input.item.imei) doc.text(`IMEI: ${input.item.imei}`);
      doc.text(`Place: ${input.item.place}`);
      doc.text(`Occurred at: ${input.item.occurredAt.toISOString()}`);
      doc.moveDown();

      doc.fontSize(14).text('Reported by');
      doc.fontSize(12);
      doc.text(`Name: ${input.user.name}`);
      doc.text(`Email: ${input.user.email}`);
      if (input.user.phone) doc.text(`Phone: ${input.user.phone}`);

      doc.end();
    });
  }
}
