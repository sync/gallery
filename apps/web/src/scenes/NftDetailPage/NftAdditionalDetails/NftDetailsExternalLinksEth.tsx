import { graphql, useFragment } from 'react-relay';
import styled from 'styled-components';

import IconContainer from '~/components/core/IconContainer';
import InteractiveLink from '~/components/core/InteractiveLink/InteractiveLink';
import { HStack, VStack } from '~/components/core/Spacer/Stack';
import { TitleDiatypeM } from '~/components/core/Text/Text';
import { ButtonPill } from '~/components/Pill';
import { NewTooltip } from '~/components/Tooltip/NewTooltip';
import { useTooltipHover } from '~/components/Tooltip/useTooltipHover';
import { NftDetailsExternalLinksEthFragment$key } from '~/generated/NftDetailsExternalLinksEthFragment.graphql';
import { RefreshIcon } from '~/icons/RefreshIcon';
import { extractRelevantMetadataFromToken } from '~/shared/utils/extractRelevantMetadataFromToken';

import { useRefreshMetadata } from './useRefreshMetadata';

type Props = {
  tokenRef: NftDetailsExternalLinksEthFragment$key;
};

export default function NftDetailsExternalLinksEth({ tokenRef }: Props) {
  const token = useFragment(
    graphql`
      fragment NftDetailsExternalLinksEthFragment on Token {
        ...useRefreshMetadataFragment
        ...extractRelevantMetadataFromTokenFragment
      }
    `,
    tokenRef
  );

  const { lastUpdated, openseaUrl, mirrorUrl, prohibitionUrl, projectUrl } =
    extractRelevantMetadataFromToken(token);

  const [refresh, isRefreshing] = useRefreshMetadata(token);

  const { floating, reference, getFloatingProps, getReferenceProps, floatingStyle } =
    useTooltipHover({
      placement: 'top',
    });

  return (
    <StyledExternalLinks gap={14}>
      {mirrorUrl && <InteractiveLink href={mirrorUrl}>View on Mirror</InteractiveLink>}
      {prohibitionUrl && (
        <InteractiveLink href={prohibitionUrl}>View on Prohibition</InteractiveLink>
      )}
      {openseaUrl && (
        <VStack gap={14}>
          <InteractiveLink href={openseaUrl}>View on OpenSea</InteractiveLink>
          <StartAlignedButtonPill
            onClick={refresh}
            disabled={isRefreshing}
            ref={reference}
            {...getReferenceProps()}
          >
            <HStack gap={6}>
              <IconContainer size="xs" variant="default" icon={<RefreshIcon />} />
              <TitleDiatypeM>Refresh metadata</TitleDiatypeM>
            </HStack>
            <NewTooltip
              {...getFloatingProps()}
              style={{ ...floatingStyle }}
              ref={floating}
              whiteSpace="pre-line"
              text={`Last refreshed ${lastUpdated}`}
            />
          </StartAlignedButtonPill>
        </VStack>
      )}
      {projectUrl && <InteractiveLink href={projectUrl}>More Info</InteractiveLink>}
    </StyledExternalLinks>
  );
}

const StyledExternalLinks = styled(VStack)``;

const StartAlignedButtonPill = styled(ButtonPill)`
  align-self: start;
`;
