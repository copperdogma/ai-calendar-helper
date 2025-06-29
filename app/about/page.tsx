'use client';

import { Box, Stack } from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';

// Import the modular components (assuming these exist or will be created)
import ProjectOverview from './components/ProjectOverview';
import CoreTechnologies from './components/CoreTechnologies';
import KeyFeatures from './components/KeyFeatures';
import GettingStarted from './components/GettingStarted';

/**
 * About page for AI Calendar Helper - describes the project's features and capabilities
 */
export default function AboutPage() {
  return (
    <PageLayout
      title="About AI Calendar Helper"
      subtitle="Transform natural language into calendar events and get intelligent summaries of your unique upcoming activities"
    >
      <Stack spacing={4}>
        {/* Project Overview Section */}
        <ProjectOverview />

        {/* Features Section */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <CoreTechnologies />
          <KeyFeatures />
        </Box>

        {/* Getting Started Section */}
        <GettingStarted />
      </Stack>
    </PageLayout>
  );
}
