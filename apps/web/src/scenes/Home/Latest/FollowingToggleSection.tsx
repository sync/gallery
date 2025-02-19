import styled from 'styled-components';

import breakpoints from '~/components/core/breakpoints';
import { HStack } from '~/components/core/Spacer/Stack';
import { TitleDiatypeM } from '~/components/core/Text/Text';
import { FEED_EVENT_ROW_WIDTH_DESKTOP } from '~/components/Feed/dimensions';
import { ClickablePill } from '~/components/Pill';
import colors from '~/shared/theme/colors';

type Props = {
  active: boolean;
};

export function FollowingToggleSection({ active }: Props) {
  return (
    <HStack justify="center">
      <FollowingSectionContainer gap={8}>
        <ClickablePill active={!active} to={{ pathname: '/latest' }}>
          <TitleDiatypeM color={colors.black['800']}>Worldwide</TitleDiatypeM>
        </ClickablePill>
        <ClickablePill active={active} to={{ pathname: '/latest/following' }}>
          <TitleDiatypeM color={colors.black['800']}>Following</TitleDiatypeM>
        </ClickablePill>
      </FollowingSectionContainer>
    </HStack>
  );
}

const FollowingSectionContainer = styled(HStack)`
  width: 100%;
  padding: 24px 0px;

  @media only screen and ${breakpoints.desktop} {
    width: ${FEED_EVENT_ROW_WIDTH_DESKTOP}px;
  }
`;
