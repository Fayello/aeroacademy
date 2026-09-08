import { EmailTemplateService } from './email-template.service';

describe('EmailTemplateService', () => {
  const service = new EmailTemplateService();

  describe('render', () => {
    it('generates valid HTML with DOCTYPE', () => {
      const { html } = service.render({ title: 'Test Email', intro: 'Hello' });
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Email');
      expect(html).toContain('Hello');
    });

    it('generates plain text alongside HTML', () => {
      const { text } = service.render({ title: 'Test Email', intro: 'Hello' });
      expect(text).toContain('Test Email');
      expect(text).toContain('Hello');
    });

    it('renders action button with correct href', () => {
      const { html } = service.render({
        title: 'Click me',
        action: { label: 'Go', href: 'https://example.com' },
      });
      expect(html).toContain('https://example.com');
      expect(html).toContain('Go');
    });

    it('renders code block', () => {
      const { html, text } = service.render({ title: 'Code', code: '123456' });
      expect(html).toContain('123456');
      expect(text).toContain('123456');
    });

    it('renders panels with tone colors', () => {
      const { html } = service.render({
        title: 'Panel',
        panels: [{ title: 'Info', body: 'Details here', tone: 'security' }],
      });
      expect(html).toContain('Info');
      expect(html).toContain('Details here');
    });

    it('renders field table', () => {
      const { html } = service.render({
        title: 'Fields',
        fields: [{ label: 'Name', value: 'Test User' }],
      });
      expect(html).toContain('Name');
      expect(html).toContain('Test User');
    });

    it('escapes HTML in user input', () => {
      const { html } = service.render({ title: '<script>alert(1)</script>' });
      expect(html).not.toContain('<script>');
    });

    it('renders secondary action', () => {
      const { html } = service.render({
        title: 'Two buttons',
        action: { label: 'Primary', href: '/a' },
        secondaryAction: { label: 'Secondary', href: '/b' },
      });
      expect(html).toContain('Primary');
      expect(html).toContain('Secondary');
    });
  });
});
