import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  size?: number;
  color?: string;
}

export default function PawIcon({ size = 24, color = '#2d6a4f' }: Props) {
  return <MaterialCommunityIcons name="paw" size={size} color={color} />;
}
