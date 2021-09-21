import { Heading, BodyRegular } from 'components/core/Text/Text';
import Spacer from 'components/core/Spacer/Spacer';

import colors from 'components/core/colors';
import breakpoints from 'components/core/breakpoints';
import styled from 'styled-components';
import { Nft } from 'types/Nft';
import NftAdditionalDetails from './NftAdditionalDetails';

type Props = {
  nft: Nft;
};

function NftDetailText({ nft }: Props) {
  return (
    <StyledDetailLabel>
      <Heading>{nft.name}</Heading>
      <Spacer height={16} />
      <BodyRegular>{nft.asset_contract.name}</BodyRegular>
      <Spacer height={16} />
      <StyledNftDescription color={colors.gray50}>
        {nft.description}
      </StyledNftDescription>
      <Spacer height={32} />
      {/* TODO__v1.1: populate Gallery Username once it's sent from backend */}
      <BodyRegular color={colors.gray50}>Owned By</BodyRegular>
      <BodyRegular>{nft.owner_address}</BodyRegular>
      <Spacer height={16} />
      <BodyRegular color={colors.gray50}>Created By</BodyRegular>
      <BodyRegular>{nft.creator_name || nft.creator_address}</BodyRegular>
      <Spacer height={32} />
      <NftAdditionalDetails nft={nft}/>
    </StyledDetailLabel>
  );
}

const StyledDetailLabel = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 296px;
  margin-top: 32px;
  word-wrap: break-word;

  @media only screen and ${breakpoints.tablet} {
    margin-left: 72px;
    margin-top: 0;
  }
`;

const StyledNftDescription = styled(BodyRegular)`
  // width: 296px;

  white-space: pre-line;
`;

export default NftDetailText;
