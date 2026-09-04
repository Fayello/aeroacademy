import { Injectable } from '@nestjs/common';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'security';

type EmailAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger';
};

type EmailPanel = {
  title: string;
  body: string;
  tone?: Tone;
};

type EmailField = {
  label: string;
  value: string | number | null | undefined;
};

type RenderEmailOptions = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  intro?: string;
  body?: string[];
  panels?: EmailPanel[];
  fields?: EmailField[];
  code?: string;
  action?: EmailAction;
  secondaryAction?: EmailAction;
  footerNote?: string;
};

type RenderedEmail = {
  html: string;
  text: string;
};

const BRAND = {
  navy: '#0F203A',
  green: '#229C62',
  lime: '#7AD62A',
  paleGreen: '#E9F8EE',
  slate: '#334155',
  muted: '#64748b',
  border: '#dbe5ee',
  background: '#edf4f8',
};

@Injectable()
export class EmailTemplateService {
  render(options: RenderEmailOptions): RenderedEmail {
    const html = this.document(options);
    const text = this.text(options);
    return { html, text };
  }

  fieldTable(fields: EmailField[]) {
    if (fields.length === 0) return '';
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 0;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
        ${fields
          .map(
            (field) => `
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};background:#f8fafc;color:${BRAND.muted};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;width:38%;">${this.escape(field.label)}</td>
                <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};background:#ffffff;color:#0f172a;font-size:14px;line-height:1.5;">${this.escape(this.value(field.value))}</td>
              </tr>`,
          )
          .join('')}
      </table>`;
  }

  panel(panel: EmailPanel) {
    const tone = panel.tone || 'default';
    const color =
      tone === 'success'
        ? BRAND.green
        : tone === 'warning'
          ? '#d97706'
          : tone === 'danger'
            ? '#dc2626'
            : tone === 'security'
              ? BRAND.navy
              : '#2563eb';
    const background =
      tone === 'success'
        ? BRAND.paleGreen
        : tone === 'warning'
          ? '#fef3c7'
          : tone === 'danger'
            ? '#fee2e2'
            : tone === 'security'
              ? '#eef2ff'
              : '#eff6ff';

    return `
      <div style="margin:18px 0 0;padding:18px 20px;border-left:4px solid ${color};background:${background};border-radius:12px;">
        <p style="margin:0 0 6px;color:#0f172a;font-size:14px;font-weight:700;">${this.escape(panel.title)}</p>
        <p style="margin:0;color:${BRAND.slate};font-size:14px;line-height:1.65;">${this.escape(panel.body)}</p>
      </div>`;
  }

  action(action: EmailAction) {
    const background =
      action.variant === 'warning'
        ? '#d97706'
        : action.variant === 'danger'
          ? '#dc2626'
          : action.variant === 'secondary'
            ? '#ffffff'
            : BRAND.green;
    const color = action.variant === 'secondary' ? BRAND.green : '#ffffff';
    const border =
      action.variant === 'secondary'
        ? `2px solid ${BRAND.green}`
        : `2px solid ${background}`;

    return `
      <a href="${this.escape(action.href)}" style="display:inline-block;background:${background};color:${color};border:${border};padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;line-height:1;">${this.escape(action.label)}</a>`;
  }

  private document(options: RenderEmailOptions) {
    const body = options.body || [];
    const panels = options.panels || [];
    const fields = options.fields || [];
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${this.escape(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:Inter,'Segoe UI',Arial,sans-serif;color:${BRAND.slate};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${this.escape(options.subtitle || options.intro || options.title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.background};">
    <tr>
      <td style="padding:28px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 12px;">
              <p style="margin:0;color:${BRAND.navy};font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">XpertClass</p>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.navy};border-radius:18px 18px 0 0;padding:34px 30px;border:1px solid ${BRAND.navy};">
              ${options.eyebrow ? `<p style="margin:0 0 12px;color:${BRAND.lime};font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;">${this.escape(options.eyebrow)}</p>` : ''}
              <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.18;font-weight:800;letter-spacing:0;">${this.escape(options.title)}</h1>
              ${options.subtitle ? `<p style="margin:12px 0 0;color:#cbd5e1;font-size:15px;line-height:1.65;">${this.escape(options.subtitle)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid ${BRAND.border};border-top:0;border-radius:0 0 18px 18px;padding:30px;">
              ${options.intro ? `<p style="margin:0 0 18px;color:${BRAND.slate};font-size:16px;line-height:1.7;">${this.escape(options.intro)}</p>` : ''}
              ${body.map((line) => `<p style="margin:0 0 16px;color:${BRAND.slate};font-size:15px;line-height:1.7;">${this.escape(line)}</p>`).join('')}
              ${options.code ? this.codeBlock(options.code) : ''}
              ${this.fieldTable(fields)}
              ${panels.map((panel) => this.panel(panel)).join('')}
              ${options.action ? `<div style="text-align:center;margin:28px 0 8px;">${this.action(options.action)}${options.secondaryAction ? `<span style="display:inline-block;width:10px;"></span>${this.action(options.secondaryAction)}` : ''}</div>` : ''}
              ${options.footerNote ? `<p style="margin:22px 0 0;color:${BRAND.muted};font-size:13px;line-height:1.6;">${this.escape(options.footerNote)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 8px 0;text-align:center;">
              <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;">XpertClass - Practical training, labs, and verifiable capability records.</p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">contact@xpertclass.academy</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private codeBlock(code: string) {
    return `
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:${BRAND.paleGreen};border:1px solid #bde9cc;border-radius:14px;padding:18px 28px;">
          <span style="color:${BRAND.navy};font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:34px;font-weight:800;letter-spacing:8px;">${this.escape(code)}</span>
        </div>
      </div>`;
  }

  private text(options: RenderEmailOptions) {
    const lines = [
      'XpertClass',
      options.eyebrow,
      options.title,
      options.subtitle,
      options.intro,
      ...(options.body || []),
      options.code ? `Code: ${options.code}` : undefined,
      ...(options.fields || []).map(
        (field) => `${field.label}: ${this.value(field.value)}`,
      ),
      ...(options.panels || []).flatMap((panel) => [panel.title, panel.body]),
      options.action ? `${options.action.label}: ${options.action.href}` : undefined,
      options.secondaryAction
        ? `${options.secondaryAction.label}: ${options.secondaryAction.href}`
        : undefined,
      options.footerNote,
      'contact@xpertclass.academy',
    ].filter(Boolean);

    return lines.join('\n\n');
  }

  private value(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') return 'Not provided';
    return String(value);
  }

  private escape(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
