import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class TransactionHelper {
  private readonly logger = new Logger(TransactionHelper.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Executes a callback within a MongoDB ACID transaction session.
   * If the MongoDB server does not support replica set transactions (e.g. standalone dev),
   * it falls back gracefully with a warning to allow local testing.
   */
  async withTransaction<T>(
    work: (session: ClientSession | null) => Promise<T>,
  ): Promise<T> {
    let session: ClientSession | null = null;
    try {
      session = await this.connection.startSession();
      session.startTransaction();

      const result = await work(session);

      await session.commitTransaction();
      return result;
    } catch (error: any) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }

      // Handle standalone MongoDB without replica set in development
      if (
        error?.message?.includes('Transaction numbers are only allowed on a replica set member') ||
        error?.message?.includes('replica set')
      ) {
        this.logger.warn(
          'Transactions are not supported on standalone MongoDB instances. Falling back to non-transactional execution for development.',
        );
        return await work(null);
      }

      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
}

