import { Module } from '@nestjs/common';
import { TestEngineService } from './test-engine.service';
import { TestEngineController } from './test-engine.controller';

@Module({
  providers: [TestEngineService],
  controllers: [TestEngineController],
  exports: [TestEngineService],
})
export class TestEngineModule {}
