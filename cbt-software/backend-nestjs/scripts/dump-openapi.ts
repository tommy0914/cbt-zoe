import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';

async function dump() {
  const app = await NestFactory.create(AppModule, { logger: false });

  try {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('CBT Platform API')
      .setDescription('Runtime generated OpenAPI document')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Write JSON
    const outJson = `${process.cwd()}/../ARCHITECTURE/openapi-runtime.json`;
    writeFileSync(outJson, JSON.stringify(document, null, 2));
    console.log(`Wrote OpenAPI JSON to ${outJson}`);

    // Try to write YAML if js-yaml is available
    try {
      const yaml = await import('js-yaml');
      const outYaml = `${process.cwd()}/../ARCHITECTURE/openapi-runtime.yaml`;
      writeFileSync(outYaml, yaml.dump(document));
      console.log(`Wrote OpenAPI YAML to ${outYaml}`);
    } catch (err) {
      console.warn('js-yaml not installed — skipping YAML generation.');
    }
  } catch (err) {
    console.error('@nestjs/swagger not installed or failed to load. Install @nestjs/swagger to generate docs.');
  } finally {
    await app.close();
  }
}

dump().catch((e) => {
  console.error(e);
  process.exit(1);
});
