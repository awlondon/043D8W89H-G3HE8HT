import 'reflect-metadata';
import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { v4 as uuid } from 'uuid';
import { IsOptional, IsString, MaxLength, MinLength, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

interface ConversationTurn {
  speaker: 'agent' | 'customer';
  text: string;
}

interface SessionState {
  id: string;
  stage: 'greeting' | 'qualification' | 'pitch' | 'closing';
  history: ConversationTurn[];
  guardrailStrikes: number;
  metadata?: Record<string, string>;
}

const knowledgeBase = [
  {
    topic: 'value-prop',
    snippets: [
      'We reduce scrap by pairing cutting plans with bend compensation tuned to your machines.',
      'Customers see fewer restacks because pallets are grouped by weight and length bands.',
    ],
  },
  {
    topic: 'safety',
    snippets: [
      'The agent will not promise delivery dates or prices beyond what has been approved.',
      'All calls are monitored and can be opted-out at any time by saying "stop".',
    ],
  },
];

const bannedWords = ['abuse', 'hate', 'violence'];

class StartSessionDto {
  @IsOptional()
  @IsString()
  callerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  campaign?: string;
}

class MessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

class GuardedResponse {
  sessionId!: string;
  reply!: string;
  stage!: SessionState['stage'];
  safetyWarnings: string[];
  knowledgeUsed: string[];
  history: ConversationTurn[];
}

class SessionRegistry {
  private sessions = new Map<string, SessionState>();

  createSession(dto: StartSessionDto): SessionState {
    const id = uuid();
    const session: SessionState = {
      id,
      stage: 'greeting',
      history: [
        {
          speaker: 'agent',
          text: dto.callerName
            ? `Hi ${dto.callerName}, thanks for taking the call. I help shops cut scrap and speed up bending.`
            : 'Hi there! I help rebar shops cut scrap and move bending faster. Mind if I share how?',
        },
      ],
      guardrailStrikes: 0,
      metadata: dto.campaign ? { campaign: dto.campaign } : undefined,
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): SessionState {
    const session = this.sessions.get(id);
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }

  upsertSession(session: SessionState) {
    this.sessions.set(session.id, session);
  }
}

class DialogueManager {
  constructor(private readonly registry: SessionRegistry) {}

  handleMessage(sessionId: string, message: string): GuardedResponse {
    const sanitized = this.applyGuardrails(message);
    const session = this.registry.getSession(sessionId);

    session.history.push({ speaker: 'customer', text: message });
    const knowledgeUsed: string[] = [];
    const reply = this.generateReply(session, sanitized, knowledgeUsed);

    session.history.push({ speaker: 'agent', text: reply });
    this.registry.upsertSession(session);

    return {
      sessionId,
      reply,
      stage: session.stage,
      safetyWarnings: sanitized.warnings,
      knowledgeUsed,
      history: session.history,
    };
  }

  private applyGuardrails(message: string): { cleaned: string; warnings: string[] } {
    const lowered = message.toLowerCase();
    const warnings = bannedWords.filter((word) => lowered.includes(word)).map((word) => `Filtered unsafe content: ${word}`);
    return {
      cleaned: warnings.length ? lowered.replace(new RegExp(bannedWords.join('|'), 'gi'), '[filtered]') : message,
      warnings,
    };
  }

  private generateReply(session: SessionState, sanitized: { cleaned: string; warnings: string[] }, knowledgeUsed: string[]): string {
    if (sanitized.warnings.length) {
      session.guardrailStrikes += sanitized.warnings.length;
      if (session.guardrailStrikes >= 2) {
        session.stage = 'closing';
        return 'I cannot continue this call, but you can email support for help.';
      }
      return 'Let us keep the conversation professional. I can answer questions about scrap reduction and bending.';
    }

    const response = this.retrieveKnowledge(sanitized.cleaned, knowledgeUsed);

    switch (session.stage) {
      case 'greeting':
        session.stage = 'qualification';
        return `${response} Can you share how you plan pallets or where scrap shows up today?`;
      case 'qualification':
        session.stage = 'pitch';
        return `${response} We optimize cut patterns and bend marks using your machine tolerances.`;
      case 'pitch':
        session.stage = 'closing';
        return `${response} If you'd like, I can set up a trial account or send pricing.`;
      default:
        return 'Thanks for the chat. Would you like me to email a summary or stop here?';
    }
  }

  private retrieveKnowledge(query: string, used: string[]): string {
    const normalized = query.toLowerCase();
    const matched = knowledgeBase.find((entry) => entry.topic === 'safety' && normalized.includes('stop'));
    if (matched) {
      used.push(matched.topic);
      return matched.snippets[1];
    }

    const value = knowledgeBase.find((entry) => entry.topic === 'value-prop');
    if (value) {
      used.push(value.topic);
      return value.snippets.join(' ');
    }

    return 'I can share how we reduce scrap and balance pallet loads.';
  }
}

@Controller('health')
class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}

@Controller('session')
class SessionController {
  constructor(private readonly manager: DialogueManager, private readonly registry: SessionRegistry) {}

  @Post()
  startSession(@Body() body: StartSessionDto) {
    this.validate(StartSessionDto, body);
    const session = this.registry.createSession(body);
    return { sessionId: session.id, firstMessage: session.history[0] };
  }

  @Post(':id/message')
  sendMessage(@Param('id') id: string, @Body() body: MessageDto) {
    this.validate(MessageDto, body);
    return this.manager.handleMessage(id, body.text);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    const session = this.registry.getSession(id);
    return session.history;
  }

  private validate<T>(cls: new () => T, payload: unknown) {
    const dto = plainToInstance(cls, payload);
    const errors = validateSync(dto as object, { whitelist: true });
    if (errors.length) {
      throw new BadRequestException(errors.map((e) => Object.values(e.constraints ?? {})).flat());
    }
  }
}

@Module({
  controllers: [SessionController, HealthController],
  providers: [SessionRegistry, DialogueManager],
})
class VoiceAgentModule {}

async function bootstrap() {
  const app = await NestFactory.create(VoiceAgentModule, { logger: false });
  await app.listen(3100);
}

bootstrap();
