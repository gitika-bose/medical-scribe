import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { CollapsibleCard } from './CollapsibleCard';

interface WhyRecommendedSectionProps {
  whyRecommended: string;
}

export function WhyRecommendedSection({ whyRecommended }: WhyRecommendedSectionProps) {
  if (!whyRecommended) return null;

  return (
    <CollapsibleCard
      icon="bulb-outline"
      iconColor="#2563EB"
      heading="Why is this the plan?"
      collapsible
      defaultCollapsed={false}
    >
      <Text style={styles.body}>{whyRecommended}</Text>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});
