import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';

import { NftAdditionalDetailsTezosFragment$key } from '~/generated/NftAdditionalDetailsTezosFragment.graphql';
import colors from '~/shared/theme/colors';
import { extractRelevantMetadataFromToken } from '~/shared/utils/extractRelevantMetadataFromToken';

import { InteractiveLink } from '../../components/InteractiveLink';
import { LinkableAddress } from '../../components/LinkableAddress';
import { DetailExternalLink, DetailLabelText, DetailSection, DetailValue } from './DetailSection';

type NftAdditionaDetailsNonPOAPProps = {
  tokenRef: NftAdditionalDetailsTezosFragment$key;
};

export function NftAdditionalDetailsTezos({ tokenRef }: NftAdditionaDetailsNonPOAPProps) {
  const token = useFragment(
    graphql`
      fragment NftAdditionalDetailsTezosFragment on Token {
        tokenId
        chain
        contract {
          creatorAddress {
            address
            ...LinkableAddressFragment
          }
          contractAddress {
            address
            ...LinkableAddressFragment
          }
        }
        ...extractRelevantMetadataFromTokenFragment
      }
    `,
    tokenRef
  );

  const { colorScheme } = useColorScheme();
  const { tokenId, fxhashUrl, objktUrl, projectUrl } = extractRelevantMetadataFromToken(token);

  const { contract } = token;

  return (
    <View className="flex flex-col space-y-4">
      <>
        {token.contract?.creatorAddress?.address && (
          <DetailSection>
            <DetailLabelText>CREATED BY</DetailLabelText>

            {/* TODO(Terence) When the contract screen is ready, setup the onPress here */}
            <LinkableAddress
              textStyle={{ color: colorScheme === 'dark' ? colors.white : colors.black['800'] }}
              chainAddressRef={token.contract.creatorAddress}
              type="NFT Detail Creator Address"
              font={{ family: 'ABCDiatype', weight: 'Bold' }}
            />
          </DetailSection>
        )}

        <View className="flex flex-col space-y-4">
          <View className="flex flex-row space-x-16">
            {contract?.contractAddress?.address && (
              <DetailSection>
                <DetailLabelText>CONTRACT</DetailLabelText>
                <LinkableAddress
                  textStyle={{ color: colorScheme === 'dark' ? colors.white : colors.black['800'] }}
                  chainAddressRef={contract.contractAddress}
                  type="NFT Detail Contract Address"
                  font={{ family: 'ABCDiatype', weight: 'Bold' }}
                />
              </DetailSection>
            )}

            {tokenId && projectUrl && (
              <DetailSection>
                <DetailLabelText>TOKEN ID</DetailLabelText>
                <InteractiveLink href={projectUrl} type="NFT Detail Token ID">
                  {tokenId}
                </InteractiveLink>
              </DetailSection>
            )}
          </View>

          <View className="flex flex-row">
            {token.chain && (
              <DetailSection>
                <DetailLabelText>NETWORK</DetailLabelText>
                <DetailValue>{token.chain}</DetailValue>
              </DetailSection>
            )}
            {fxhashUrl && (
              <DetailSection>
                <DetailLabelText>VIEW ON</DetailLabelText>
                <View className="flex flex-row">
                  <DetailExternalLink
                    link={fxhashUrl}
                    label="fxhash"
                    trackingLabel="NFT Detail View on fxhashUrl"
                    showExternalLinkIcon={true}
                    font={{ family: 'ABCDiatype', weight: 'Bold' }}
                  />
                </View>
              </DetailSection>
            )}
            {objktUrl && (
              <DetailSection>
                <DetailLabelText>VIEW ON</DetailLabelText>
                <View className="flex flex-row">
                  <DetailExternalLink
                    link={objktUrl}
                    label="objkt"
                    trackingLabel="NFT Detail View on objktUrl"
                    showExternalLinkIcon={true}
                    font={{ family: 'ABCDiatype', weight: 'Bold' }}
                  />
                </View>
              </DetailSection>
            )}
            {projectUrl && (
              <DetailSection>
                <DetailLabelText>VIEW ON</DetailLabelText>
                <View className="flex flex-col pt-4">
                  <DetailExternalLink
                    link={projectUrl}
                    label="Visit Site"
                    trackingLabel="NFT Detail View on External Link"
                    showExternalLinkIcon={true}
                    font={{ family: 'ABCDiatype', weight: 'Bold' }}
                  />
                </View>
              </DetailSection>
            )}
          </View>
        </View>
      </>
    </View>
  );
}
