import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Repeat, ChevronDown } from 'react-native-feather';
import { useStyles } from './styles';

type Props = {
  from: string;
  to: string;
  onOpenFrom: () => void;
  onOpenTo: () => void;
  onSwap: () => void;
  renderFlag?: (code: string) => React.ReactNode;
};


export const CompactCurrencyBar: React.FC<Props> = ({
  from, to, onOpenFrom, onOpenTo, onSwap, renderFlag,
}) => {
  const s = useStyles();
  return (
    <View style={s.wrap}>
      <Pressable style={s.pill} onPress={onOpenFrom}>
        <Text style={s.flag}>{renderFlag ? renderFlag(from) : from}</Text>
        <Text style={s.code}>{from}</Text>
        <ChevronDown />
      </Pressable>

      <Pressable style={s.swap} onPress={onSwap}>
        <Repeat />
      </Pressable>

      <Pressable style={s.pill} onPress={onOpenTo}>
        <Text style={s.flag}>{renderFlag ? renderFlag(to) : to}</Text>
        <Text style={s.code}>{to}</Text>
        <ChevronDown />
      </Pressable>
    </View>
  );
};
