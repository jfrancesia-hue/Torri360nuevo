import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface ClassificationResult {
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  categoryHint: string;
  tradeHint: string;
  confidence: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — AI classification disabled');
    }
  }

  async classifyTicket(rawText: string): Promise<ClassificationResult> {
    const fallback: ClassificationResult = {
      title: rawText.slice(0, 100),
      description: rawText,
      priority: 'MEDIUM',
      categoryHint: '',
      tradeHint: '',
      confidence: 0,
    };

    if (!this.openai) return fallback;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Sos un asistente de clasificación de tickets de mantenimiento.
Dado un mensaje de texto libre (puede ser de WhatsApp), extraé la información relevante y respondé SOLO con JSON válido.

Estructura esperada:
{
  "title": "título corto del problema (max 100 chars)",
  "description": "descripción limpia y completa",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "categoryHint": "categoría probable (ej: Plomería, Electricidad, Limpieza, Seguridad, etc.)",
  "tradeHint": "rubro del proveedor necesario (ej: Plomero, Electricista, etc.)",
  "confidence": 0.0-1.0
}

Criterios de prioridad:
- CRITICAL: emergencia, peligro, inundación, incendio, sin luz en áreas críticas
- HIGH: afecta múltiples personas o funciones importantes
- MEDIUM: problema moderado, funcional pero inconveniente
- LOW: cosmético, no urgente`,
          },
          {
            role: 'user',
            content: rawText,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 400,
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return fallback;

      const parsed = JSON.parse(content) as ClassificationResult;
      return {
        title: parsed.title || fallback.title,
        description: parsed.description || rawText,
        priority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.priority)
          ? parsed.priority
          : 'MEDIUM',
        categoryHint: parsed.categoryHint || '',
        tradeHint: parsed.tradeHint || '',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch (err) {
      this.logger.error('AI classification failed', err);
      return fallback;
    }
  }
}
