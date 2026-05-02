import React from 'react';
import HomeDashboard from '../../components/HomeDashboard';

export default function LecturerHubScreen({ navigation }) {
  return (
    <HomeDashboard
      navigation={navigation}
      fallbackName="Lecturer"
    />
  );
}
