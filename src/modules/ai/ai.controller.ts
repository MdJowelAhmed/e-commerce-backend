import {
  Controller,
  Post,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  AiChatDto,
  AiSearchQueryDto,
  OutfitGeneratorQueryDto,
} from './dto/ai.dto';
import { Public } from '@common/decorators/public.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('AI Concierge & Styling')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Post('chat')
  @ApiOperation({
    summary: 'Luxury fashion concierge chat powered by Gemini 1.5 Flash grounded in product catalog',
  })
  @ResponseMessage('Concierge response generated')
  async chat(@Body() dto: AiChatDto) {
    return this.aiService.chat(dto);
  }

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'Natural language search intent parser for budget, season, and occasion matching',
  })
  @ResponseMessage('Semantic search completed')
  async search(@Query() query: AiSearchQueryDto) {
    return this.aiService.search(query);
  }

  @Public()
  @Get('outfit-generator')
  @ApiOperation({
    summary: 'AI Outfit recommendations pairing anchor apparel with matching accessories',
  })
  @ResponseMessage('Outfit ensemble curated')
  async generateOutfit(@Query() query: OutfitGeneratorQueryDto) {
    return this.aiService.generateOutfit(query);
  }
}

