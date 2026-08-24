import { Module } from '@nestjs/common';
import { GenomeController } from './genome.controller';

@Module({
  controllers: [GenomeController],
})
export class GenomeModule {}
