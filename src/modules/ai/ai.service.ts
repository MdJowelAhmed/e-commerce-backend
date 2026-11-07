import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { Product, ProductDocument } from '@modules/products/schemas/product.schema';
import { AiChatDto, AiSearchQueryDto, OutfitGeneratorQueryDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiClient: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    this.modelName = this.configService.get<string>('ai.geminiModel') || 'gemini-1.5-flash';

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log(`Google Gemini AI initialized with model: ${this.modelName}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Gemini AI: ${err.message}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY is not configured. Running AI service in luxury fallback mode.');
    }
  }

  /**
   * Grounded Luxury Concierge Chat
   */
  async chat(dto: AiChatDto) {
    // 1. Fetch snapshot of current catalog products for grounding
    const catalogSnapshot = await this.productModel
      .find({ isActive: true })
      .select('title slug brand category basePrice materials variants')
      .limit(15)
      .lean();

    const catalogContext = catalogSnapshot
      .map(
        (p) =>
          `- ${p.title} (${p.brand}) | Category: ${p.category} | Price: ৳${p.basePrice} | Slug: ${p.slug} | Materials: ${p.materials.join(', ')}`,
      )
      .join('\n');

    const systemPrompt = `You are "Luxe Concierge", an elite private sartorial advisor for Luxe, a high-end luxury fashion atelier and eCommerce house.
You speak with effortless sophistication, warmth, and encyclopedic knowledge of fabrics, cuts, styling, and etiquette.
Currency is Bangladeshi Taka (৳ / BDT).

CRITICAL GROUNDING RULES:
1. Recommend ONLY items that exist in our actual catalog listed below:
${catalogContext}
2. When mentioning a product, refer to it by its exact title and price in ৳.
3. Suggest styling tips, color coordination, and care advice suitable for Dhaka's high society, galas, and international travel.`;

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nCustomer question: ${dto.message}` }] },
          ],
        });

        const reply = response.text || 'I would be delighted to assist you with our bespoke collection.';
        const matchedProducts = catalogSnapshot.filter((p) =>
          reply.toLowerCase().includes(p.title.toLowerCase()),
        );

        return {
          reply,
          recommendedProducts: matchedProducts,
        };
      } catch (err: any) {
        this.logger.error(`Gemini API error during chat: ${err.message}`);
      }
    }

    // High-fidelity fallback when API key is not present or offline
    const matchedProducts = catalogSnapshot.filter(
      (p) =>
        dto.message.toLowerCase().includes(p.category.toLowerCase()) ||
        dto.message.toLowerCase().includes(p.brand.toLowerCase()) ||
        dto.message.toLowerCase().includes('coat') ||
        dto.message.toLowerCase().includes('suit'),
    );

    return {
      reply: `Good day. At Luxe, each piece in our atelier is crafted with uncompromising attention to detail. Based on your inquiry regarding "${dto.message}", I recommend exploring our signature cashmere outerwear and hand-finished Italian tailoring.`,
      recommendedProducts: matchedProducts.length > 0 ? matchedProducts : catalogSnapshot.slice(0, 3),
    };
  }

  /**
   * Natural Language Semantic Search Parser
   * Parses user intent (budget, season, category, occasion) into MongoDB queries
   */
  async search(dto: AiSearchQueryDto) {
    let parsedIntent = {
      budgetMax: 100000,
      category: '',
      keywords: [] as string[],
    };

    if (this.aiClient) {
      try {
        const prompt = `Extract search intent from this luxury customer request: "${dto.query}".
Respond ONLY with a valid JSON object matching this schema:
{
  "budgetMax": number or null,
  "category": string or null,
  "keywords": string[]
}`;
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const jsonText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
        if (jsonText) {
          parsedIntent = JSON.parse(jsonText);
        }
      } catch (err: any) {
        this.logger.warn(`Intent parser error: ${err.message}`);
      }
    }

    // Build intelligent query
    const filter: Record<string, any> = { isActive: true };

    // Budget extraction heuristic
    const budgetMatch = dto.query.match(/(?:under|below|budget|max)?\s*(?:৳|bdt|tk)?\s*(\d{4,6})/i);
    const budget = parsedIntent.budgetMax || (budgetMatch ? parseInt(budgetMatch[1], 10) : undefined);

    if (budget) {
      filter.basePrice = { $lte: budget };
    }

    if (parsedIntent.category) {
      filter.category = new RegExp(parsedIntent.category, 'i');
    }

    const products = await this.productModel
      .find(filter)
      .limit(8)
      .lean();

    return {
      query: dto.query,
      interpretedIntent: {
        budget: budget || null,
        category: parsedIntent.category || 'All Luxury Collections',
        keywords: parsedIntent.keywords || [],
      },
      results: products,
      count: products.length,
    };
  }

  /**
   * AI Outfit Generator
   * Recommends cohesive ensemble matching an anchor product or occasion
   */
  async generateOutfit(dto: OutfitGeneratorQueryDto) {
    let anchorProduct: any = null;

    if (dto.anchorProductId && Types.ObjectId.isValid(dto.anchorProductId)) {
      anchorProduct = await this.productModel.findById(dto.anchorProductId).lean();
    }

    if (!anchorProduct) {
      anchorProduct = await this.productModel.findOne({ isFeatured: true, isActive: true }).lean();
    }

    // Find complementary categories
    const allProducts = await this.productModel.find({ isActive: true }).lean();

    const ensemble = {
      theme: dto.occasion || 'Evening Sartorial Elegance',
      anchor: anchorProduct,
      complementaryPieces: allProducts
        .filter((p) => p._id.toString() !== anchorProduct?._id?.toString())
        .slice(0, 3),
      stylingNotes:
        'Pair your focal piece with refined tonal layers. Opt for soft merino knitwear beneath structural tailoring, accented with hand-burnished calfskin leather.',
    };

    return ensemble;
  }
}

