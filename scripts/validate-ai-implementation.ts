#!/usr/bin/env tsx

/**
 * Simple validation script to test our AI implementation
 */

import { AIProcessingService, AIModel } from '../lib/ai';

async function validateImplementation() {
  console.log('🧪 Validating AI Implementation...');

  try {
    // Test GPT-4o-mini with a simple case
    const service = new AIProcessingService(undefined, AIModel.GPT_4O_MINI);

    console.log('🔬 Testing GPT-4o-mini with simple event...');

    const startTime = Date.now();
    const result = await service.extractEventDetails('Lunch tomorrow at 1pm', {
      timezone: 'America/New_York',
      currentDate: new Date('2025-06-10T12:00:00-04:00'),
    });
    const processingTime = Date.now() - startTime;

    console.log('✅ Success! Results:');
    console.log(`   Title: ${result.title}`);
    console.log(`   Start: ${result.startDate.toISOString()}`);
    console.log(`   End: ${result.endDate.toISOString()}`);
    console.log(`   Location: ${result.location}`);
    console.log(`   Confidence: ${result.confidence.overall.toFixed(3)}`);
    console.log(`   Processing time: ${processingTime}ms`);

    // Test cost estimation
    const estimatedCost = service.estimateCost(50, 200, AIModel.GPT_4O_MINI);
    console.log(`   Estimated cost: $${estimatedCost.toFixed(6)}`);

    console.log('\n🎉 Implementation validation successful!');
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

validateImplementation();
