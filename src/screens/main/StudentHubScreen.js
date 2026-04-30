import React from 'react';
import HomeDashboard from '../../components/HomeDashboard';

export default function StudentHubScreen({ navigation }) {
  return (
    <HomeDashboard
      navigation={navigation}
      title="UTech Home"
      fallbackName="Student"
      iconName="ribbon-outline"
      accentKey="secondary"
    />
  );
}
