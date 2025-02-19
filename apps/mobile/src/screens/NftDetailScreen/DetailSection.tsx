import { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';

import { InteractiveLink } from '~/components/InteractiveLink';

import { Typography, TypographyProps } from '../../components/Typography';
import { ExternalLinkIcon } from '../../icons/ExternalLinkIcon';

export function DetailSection({
  children,
  style,
}: PropsWithChildren<{ style?: ViewProps['style'] }>) {
  return (
    <View style={style} className="flex flex-1 flex-col items-start">
      {children}
    </View>
  );
}

export function DetailLabelText({ children }: PropsWithChildren) {
  return (
    <Typography
      className="text-xs text-shadow dark:color-metal"
      font={{ family: 'ABCDiatype', weight: 'Medium' }}
    >
      {children}
    </Typography>
  );
}

export function DetailValue({ children }: PropsWithChildren) {
  return (
    <Typography
      numberOfLines={1}
      ellipsizeMode="middle"
      className="text-sm"
      font={{ family: 'ABCDiatype', weight: 'Bold' }}
    >
      {children}
    </Typography>
  );
}

type DetailExternalLinkProps = {
  link: string;
  label: string;
  trackingLabel: string;
  font?: TypographyProps['font'];
  showExternalLinkIcon?: boolean;
};
export function DetailExternalLink({
  link,
  label,
  trackingLabel,
  font,
  showExternalLinkIcon = false,
}: DetailExternalLinkProps) {
  return (
    <InteractiveLink href={link} type={trackingLabel}>
      <View className="flex flex-row">
        <Typography
          numberOfLines={1}
          ellipsizeMode="middle"
          className="text-sm"
          font={font ?? { family: 'ABCDiatype', weight: 'Regular' }}
        >
          {label}
        </Typography>
        {showExternalLinkIcon && (
          <View className="flex align-center justify-center">
            <ExternalLinkIcon />
          </View>
        )}
      </View>
    </InteractiveLink>
  );
}
