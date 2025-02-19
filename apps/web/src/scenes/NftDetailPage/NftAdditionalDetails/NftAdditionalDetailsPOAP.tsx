import { graphql, useFragment } from 'react-relay';

import { VStack } from '~/components/core/Spacer/Stack';
import { BaseM, TitleXS } from '~/components/core/Text/Text';
import { NftAdditionalDetailsPOAPFragment$key } from '~/generated/NftAdditionalDetailsPOAPFragment.graphql';
import extractPoapMetadata from '~/shared/utils/extractPoapMetadata';

type POAPNftDetailSectionProps = {
  tokenRef: NftAdditionalDetailsPOAPFragment$key;
};

export function NftAdditionalDetailsPOAP({ tokenRef }: POAPNftDetailSectionProps) {
  const token = useFragment(
    graphql`
      fragment NftAdditionalDetailsPOAPFragment on Token {
        tokenMetadata
      }
    `,
    tokenRef
  );

  if (!token.tokenMetadata) {
    return null;
  }

  const { id, location, createdDate, supply, chain } = extractPoapMetadata(token.tokenMetadata);

  return (
    <VStack gap={16}>
      {createdDate && (
        <div>
          <TitleXS>Created</TitleXS>
          <BaseM>{createdDate}</BaseM>
        </div>
      )}
      {location && (
        <div>
          <TitleXS>Location</TitleXS>
          <BaseM>{location}</BaseM>
        </div>
      )}

      {id && (
        <div>
          <TitleXS>POAP ID</TitleXS>
          <BaseM>{id}</BaseM>
        </div>
      )}
      {supply && (
        <div>
          <TitleXS>SUPPLY</TitleXS>
          <BaseM>{supply}</BaseM>
        </div>
      )}
      {chain && (
        <div>
          <TitleXS>CHAIN</TitleXS>
          <BaseM>{chain}</BaseM>
        </div>
      )}
    </VStack>
  );
}
