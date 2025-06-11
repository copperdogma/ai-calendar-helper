#!/usr/bin/env tsx

/**
 * Model Comparison Test Script
 *
 * This script tests different AI models for calendar parsing to determine
 * the optimal balance of accuracy, speed, and cost.
 */

import { AIProcessingService, AIModel, MODEL_CONFIGS, type ExtractedEventData } from '../lib/ai';

// Test cases representing different complexity levels
const TEST_CASES = [
  {
    name: 'Simple Event',
    input: 'Lunch tomorrow at 1pm',
    expectedFields: ['title', 'startDate', 'endDate'],
    complexity: 'low',
  },
  {
    name: 'Event with Location',
    input: 'Board meeting next Tuesday 2-4pm at conference room A',
    expectedFields: ['title', 'startDate', 'endDate', 'location'],
    complexity: 'medium',
  },
  {
    name: 'Multi-Event Text',
    input: 'Dentist Monday 10am, dinner with Sarah Friday 7pm',
    expectedFields: ['title', 'startDate', 'endDate'],
    complexity: 'high',
    note: 'Tests first event only - this is a known limitation',
  },
  {
    name: 'Ambiguous Time',
    input: 'Call mom sometime this afternoon',
    expectedFields: ['title', 'startDate'],
    complexity: 'high',
  },
  {
    name: 'Recurring Event',
    input: 'Team standup every Monday at 9am',
    expectedFields: ['title', 'startDate', 'endDate', 'recurrence'],
    complexity: 'medium',
  },
  {
    name: 'All-Day Event',
    input: 'Vacation December 25th',
    expectedFields: ['title', 'startDate', 'isAllDay'],
    complexity: 'low',
  },
  {
    name: 'Event with Timezone',
    input: 'Conference call 3pm EST with client',
    expectedFields: ['title', 'startDate', 'endDate', 'timezone'],
    complexity: 'medium',
  },
];

interface TestResult {
  model: AIModel;
  testCase: string;
  success: boolean;
  extractedData?: ExtractedEventData;
  error?: string;
  processingTime: number;
  estimatedCost: number;
}

interface ModelResults {
  model: AIModel;
  results: TestResult[];
  summary: {
    successRate: number;
    averageProcessingTime: number;
    totalCost: number;
    averageConfidence: number;
  };
}

class ModelComparisonTester {
  private results: ModelResults[] = [];

  async runComparison(): Promise<void> {
    console.log('🧪 Starting AI Model Comparison Test');
    console.log('='.repeat(60));

    const modelsToTest = [AIModel.GPT_4O_MINI, AIModel.GPT_4, AIModel.GPT_4_1_MINI];

    for (const model of modelsToTest) {
      console.log(`\n🔬 Testing ${MODEL_CONFIGS[model].name}...`);
      const modelResults = await this.testModel(model);
      this.results.push(modelResults);
    }

    this.generateReport();
  }

  private async testModel(model: AIModel): Promise<ModelResults> {
    const service = new AIProcessingService(undefined, model);
    const results: TestResult[] = [];

    for (const testCase of TEST_CASES) {
      console.log(`  📝 Testing: ${testCase.name}`);

      const startTime = Date.now();
      let success = false;
      let extractedData: ExtractedEventData | undefined;
      let error: string | undefined;

      try {
        extractedData = await service.extractEventDetails(testCase.input, {
          timezone: 'America/New_York',
          currentDate: new Date('2025-06-10T12:00:00-04:00'), // Fixed date for consistent testing
        });

        // Basic validation - check if required fields are present and reasonable
        success = this.validateExtraction(extractedData, testCase.expectedFields);

        if (!success) {
          error = 'Validation failed - missing or invalid required fields';
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
      }

      const processingTime = Date.now() - startTime;

      // Estimate cost (rough estimate based on typical token usage)
      const estimatedInputTokens = Math.ceil(testCase.input.length / 3.5); // Rough estimate
      const estimatedOutputTokens = 200; // Typical output size
      const estimatedCost = service.estimateCost(
        estimatedInputTokens,
        estimatedOutputTokens,
        model
      );

      results.push({
        model,
        testCase: testCase.name,
        success,
        extractedData,
        error,
        processingTime,
        estimatedCost,
      });

      // Brief delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      model,
      results,
      summary: this.calculateSummary(results),
    };
  }

  private validateExtraction(data: ExtractedEventData, expectedFields: string[]): boolean {
    // Check if all expected fields are present and reasonable
    for (const field of expectedFields) {
      switch (field) {
        case 'title':
          if (!data.title || data.title.trim() === '') return false;
          break;
        case 'startDate':
          if (!data.startDate || isNaN(data.startDate.getTime())) return false;
          break;
        case 'endDate':
          if (!data.endDate || isNaN(data.endDate.getTime())) return false;
          if (data.endDate <= data.startDate) return false;
          break;
        case 'location':
          if (!data.location || data.location.trim() === '') return false;
          break;
        case 'timezone':
          if (!data.timezone || data.timezone === 'UTC') return false; // We expect non-UTC
          break;
        case 'recurrence':
          if (!data.recurrence) return false;
          break;
        case 'isAllDay':
          if (!data.isAllDay) return false;
          break;
      }
    }

    // Check confidence scores are reasonable (> 0.3 for overall)
    if (data.confidence.overall < 0.3) return false;

    return true;
  }

  private calculateSummary(results: TestResult[]): ModelResults['summary'] {
    const successfulResults = results.filter(r => r.success);
    const successRate = successfulResults.length / results.length;

    const averageProcessingTime =
      results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const totalCost = results.reduce((sum, r) => sum + r.estimatedCost, 0);

    const averageConfidence =
      successfulResults.length > 0
        ? successfulResults.reduce(
            (sum, r) => sum + (r.extractedData?.confidence.overall || 0),
            0
          ) / successfulResults.length
        : 0;

    return {
      successRate,
      averageProcessingTime,
      totalCost,
      averageConfidence,
    };
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MODEL COMPARISON RESULTS');
    console.log('='.repeat(60));

    // Summary table
    console.log('\n📈 SUMMARY COMPARISON:');
    console.log('─'.repeat(80));
    console.log(
      'Model'.padEnd(15) +
        'Success Rate'.padEnd(15) +
        'Avg Time (ms)'.padEnd(15) +
        'Total Cost ($)'.padEnd(15) +
        'Avg Confidence'
    );
    console.log('─'.repeat(80));

    for (const modelResult of this.results) {
      const config = MODEL_CONFIGS[modelResult.model];
      const summary = modelResult.summary;

      console.log(
        config.name.padEnd(15) +
          `${(summary.successRate * 100).toFixed(1)}%`.padEnd(15) +
          `${summary.averageProcessingTime.toFixed(0)}`.padEnd(15) +
          `$${summary.totalCost.toFixed(6)}`.padEnd(15) +
          `${summary.averageConfidence.toFixed(3)}`
      );
    }

    // Cost comparison
    console.log('\n💰 COST ANALYSIS:');
    console.log('─'.repeat(60));
    const baseCost = this.results[0]?.summary.totalCost || 0;

    for (const modelResult of this.results) {
      const config = MODEL_CONFIGS[modelResult.model];
      const costMultiplier = baseCost > 0 ? modelResult.summary.totalCost / baseCost : 1;

      console.log(
        `${config.name}: $${modelResult.summary.totalCost.toFixed(6)} (${costMultiplier.toFixed(1)}x baseline)`
      );
    }

    // Recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('─'.repeat(60));

    const bestAccuracy = this.results.reduce((best, current) =>
      current.summary.successRate > best.summary.successRate ? current : best
    );

    const mostCostEffective = this.results.reduce((best, current) =>
      current.summary.totalCost < best.summary.totalCost ? current : best
    );

    const bestBalanced = this.results.reduce((best, current) => {
      const currentScore =
        current.summary.successRate * 0.6 +
        (1 - current.summary.totalCost / this.results[0].summary.totalCost) * 0.4;
      const bestScore =
        best.summary.successRate * 0.6 +
        (1 - best.summary.totalCost / this.results[0].summary.totalCost) * 0.4;
      return currentScore > bestScore ? current : best;
    });

    console.log(
      `🏆 Best Accuracy: ${MODEL_CONFIGS[bestAccuracy.model].name} (${(bestAccuracy.summary.successRate * 100).toFixed(1)}%)`
    );
    console.log(
      `💡 Most Cost-Effective: ${MODEL_CONFIGS[mostCostEffective.model].name} ($${mostCostEffective.summary.totalCost.toFixed(6)})`
    );
    console.log(`⚖️  Best Balance: ${MODEL_CONFIGS[bestBalanced.model].name}`);

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    console.log('─'.repeat(60));

    for (const modelResult of this.results) {
      console.log(`\n${MODEL_CONFIGS[modelResult.model].name}:`);

      for (const result of modelResult.results) {
        const status = result.success ? '✅' : '❌';
        const confidence = result.extractedData?.confidence.overall.toFixed(3) || 'N/A';
        const timeMs = result.processingTime;
        const cost = result.estimatedCost.toFixed(6);

        console.log(`  ${status} ${result.testCase} (${timeMs}ms, $${cost}, conf: ${confidence})`);

        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      }
    }
  }
}

// Run the comparison if this script is executed directly
if (require.main === module) {
  const tester = new ModelComparisonTester();
  tester.runComparison().catch(console.error);
}

export { ModelComparisonTester };
