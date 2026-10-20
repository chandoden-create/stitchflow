import React from 'react';
import { Text, TextStyle } from 'react-native';
import { formatINR } from '../../lib/utils/currency';

interface CurrencyTextProps {
  amount: number | string;
  style?: TextStyle | TextStyle[];
  symbol?: string;
  showZero?: boolean;
}

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  amount,
  style,
  symbol = '₹',
  showZero = true,
}) => {
  return <Text style={style}>{formatINR(amount, symbol)}</Text>;
};
