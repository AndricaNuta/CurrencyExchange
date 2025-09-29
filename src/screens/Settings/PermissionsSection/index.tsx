import React, { useEffect, useState } from 'react';
import { Alert, View, Text, Switch, StyleSheet } from 'react-native';
import { Camera, Image as ImageIcon } from 'react-native-feather';
import { useTheme } from '../../../theme/ThemeProvider';
import { alpha } from '../../../theme/tokens';
import { getStatus, requestOnce, isGranted, openSettings, RESULTS } from '../../../services/permissions';

const Row = ({
  icon, title, granted, onToggle, sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  granted: boolean;
  onToggle: (v: boolean) => void;
}) => {
  const t = useTheme();
  return (
    <View style={s.row}>
      <View style={[s.circle, {
        backgroundColor: alpha(t.colors.tint, 0.12)
      }]}>{icon}</View>
      <View style={{
        flex: 1
      }}>
        <Text style={[s.title, {
          color: t.colors.text
        }]}>{title}</Text>
        <Text style={[s.sub, {
          color: t.colors.muted
        }]}>{sub}</Text>
      </View>
      <Switch
        value={granted}
        onValueChange={onToggle}
        thumbColor={t.colors.surface}
        trackColor={{
          false: alpha(t.colors.text, 0.18),
          true: t.colors.success
        }}
      />
    </View>
  );
};

export const PermissionsCard = () => {
  const t = useTheme();

  const [camOK, setCamOK] = useState(false);
  const [libOK, setLibOK] = useState(false);

  const refresh = async () => {
    const [c, p] = await Promise.all([getStatus('camera'), getStatus('photos')]);
    setCamOK(isGranted(c));
    setLibOK(isGranted(p));
  };
  useEffect(() => { refresh(); }, []);

  const handleToggle = async (which: 'camera' | 'photos', v: boolean) => {
    if (v) {
      const res = await requestOnce(which);
      if (!isGranted(res)) {
        if (res === RESULTS.BLOCKED) {
          Alert.alert(
            'Permission required',
            'Please enable Camera in Settings.',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Open Settings',
                onPress: () => openSettings()
              },
            ]
          );
        } else {
          // DENIED or LIMITED-not-supported => do nothing; user can try again
        }
      }
    } else {
      Alert.alert(
        'Permission required',
        'Please enable Camera in Settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open Settings',
            onPress: () => openSettings()
          },
        ]
      );
    }
    setTimeout(refresh, 350);
  };


  return (
    <View style={[s.card, {
      backgroundColor: t.colors.card,
      borderColor: alpha(t.colors.text, 0.06)
    }]}>
      <Row
        icon={<Camera width={18} height={18} color={t.colors.icon} />}
        title="Camera"
        sub={camOK ? 'Allowed' : 'Not allowed'}
        granted={camOK}
        onToggle={(v) => handleToggle('camera', v)}
      />

      <View style={[s.sep, {
        borderBottomColor: alpha(t.colors.text, 0.08)
      }]} />

      <Row
        icon={<ImageIcon width={18} height={18} color={t.colors.icon} />}
        title="Photo Library"
        sub={libOK ? 'Allowed' : 'Not allowed'}
        granted={libOK}
        onToggle={(v) => handleToggle('photos', v)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth
  },
  header: {
    fontSize: 18,
    fontWeight: '800'
  },
  caption: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  sub: {
    fontSize: 12,
    marginTop: 2
  },
  sep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 6
  },
});
