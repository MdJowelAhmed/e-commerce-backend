import { Module, Global, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { TransactionHelper } from './transaction.helper';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri')!;
        const logger = new Logger('MongooseDatabase');

        return {
          uri,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              logger.log(`MongoDB successfully connected to: ${connection.host}:${connection.port}/${connection.name}`);
            });
            connection.on('error', (error) => {
              logger.error(`MongoDB connection error: ${error.message}`, error.stack);
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB connection disconnected');
            });
            return connection;
          },
        };
      },
    }),
  ],
  providers: [TransactionHelper],
  exports: [TransactionHelper, MongooseModule],
})
export class DatabaseModule {}

