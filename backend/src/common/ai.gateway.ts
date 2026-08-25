import { Injectable, Logger } from '@nestjs/common';

export interface AiGenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  format?: 'json' | 'text';
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatOptions {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AiStreamChunk {
  token?: string;
  done?: boolean;
  error?: string;
}

export interface AiGateway {
  readonly name: string;
  generate(options: AiGenerateOptions): Promise<string>;
  chat(options: AiChatOptions): Promise<string>;
  chatStream(options: AiChatOptions): Promise<ReadableStream<Uint8Array>>;
  isAvailable(): Promise<boolean>;
}

@Injectable()
export class OllamaGateway implements AiGateway {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaGateway.name);
  private readonly host: string;
  private readonly model: string;

  constructor() {
    this.host = process.env.OLLAMA_HOST || 'http://5.189.182.196:11434';
    this.model = process.env.OLLAMA_MODEL || 'xpertcoach';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.host}/api/tags`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(options: AiGenerateOptions): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      prompt: options.prompt,
      stream: false,
      options: {},
    };
    if (options.system) body.system = options.system;
    if (options.temperature !== undefined) (body.options as Record<string, unknown>).temperature = options.temperature;
    if (options.maxTokens !== undefined) (body.options as Record<string, unknown>).num_predict = options.maxTokens;
    if (options.format === 'json') body.format = 'json';

    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`Ollama generate error: ${res.status}`);
    const data = await res.json();
    return data.response || '';
  }

  async chat(options: AiChatOptions): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: options.messages,
      stream: false,
      options: {},
    };
    if (options.temperature !== undefined) (body.options as Record<string, unknown>).temperature = options.temperature;
    if (options.maxTokens !== undefined) (body.options as Record<string, unknown>).num_predict = options.maxTokens;

    const res = await fetch(`${this.host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`Ollama chat error: ${res.status}`);
    const data = await res.json();
    return data.message?.content || '';
  }

  async chatStream(options: AiChatOptions): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    const self = this;

    return new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch(`${self.host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: self.model,
              messages: options.messages,
              stream: true,
            }),
            signal: AbortSignal.timeout(120000),
          });

          if (!res.ok) {
            const errText = await res.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Ollama error: ${res.status} ${errText}` })}\n\n`));
            controller.close();
            return;
          }

          const reader = res.body?.getReader();
          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const chunk = JSON.parse(line);
                if (chunk.message?.content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.message.content })}\n\n`));
                }
                if (chunk.done) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                }
              } catch {}
            }
          }

          if (buffer.trim()) {
            try {
              const chunk = JSON.parse(buffer);
              if (chunk.message?.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.message.content })}\n\n`));
              }
              if (chunk.done) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              }
            } catch {}
          }

          controller.close();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Stream failed';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.close();
        }
      },
    });
  }
}

@Injectable()
export class AiGatewayFactory {
  private readonly logger = new Logger(AiGatewayFactory.name);
  private gateways: AiGateway[] = [];

  register(gateway: AiGateway) {
    this.gateways.push(gateway);
    this.logger.log(`Registered AI gateway: ${gateway.name}`);
  }

  getGateway(name?: string): AiGateway | undefined {
    if (name) return this.gateways.find((g) => g.name === name);
    return this.gateways[0];
  }

  async getAvailableGateway(): Promise<AiGateway | undefined> {
    for (const gw of this.gateways) {
      if (await gw.isAvailable()) return gw;
    }
    return undefined;
  }

  listGateways(): Array<{ name: string; available: boolean }> {
    return this.gateways.map((g) => ({ name: g.name, available: false }));
  }
}
