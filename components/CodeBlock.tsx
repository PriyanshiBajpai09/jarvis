// CodeBlock.tsx — Part E: rich code rendering. Dark monospace block,
// preserved indentation, horizontal scroll for long lines, copy button.
// Normal text bubbles are unaffected — this only renders for segments
// parseMessageSegments identified as fenced code.

import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts } from '../theme/theme';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const COPY_RESET_MS = 1500;

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_RESET_MS);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.language}>{language ? language.toUpperCase() : 'CODE'}</Text>
        <TouchableOpacity onPress={handleCopy} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.copyLabel}>{copied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <Text style={styles.code}>{code}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(2,6,16,0.85)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,234,255,0.2)',
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,234,255,0.15)',
  },
  language: { fontFamily: fonts.display, fontSize: 9, letterSpacing: 1.2, color: colors.cyanSoft },
  copyLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textDim, textTransform: 'uppercase' },
  scroll: { paddingHorizontal: 10, paddingVertical: 8 },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textPrimary,
  },
});

export default CodeBlock;