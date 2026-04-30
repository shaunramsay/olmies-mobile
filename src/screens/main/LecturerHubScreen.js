import React from 'react';
import HomeDashboard from '../../components/HomeDashboard';

export default function LecturerHubScreen({ navigation }) {
  return (
    <HomeDashboard
      navigation={navigation}
      title="Lecturer Home"
      fallbackName="Lecturer"
      iconName="school-outline"
      accentKey="primary"
    />
  );
}
