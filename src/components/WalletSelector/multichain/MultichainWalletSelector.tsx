import styled from 'styled-components';
import { useCallback, useState } from 'react';
import { ADD_WALLET_TO_USER, AUTH, CONNECT_WALLET_ONLY } from 'types/Wallet';
import breakpoints from 'components/core/breakpoints';
import { graphql, useFragment } from 'react-relay';
import { MultichainWalletSelectorFragment$key } from '__generated__/MultichainWalletSelectorFragment.graphql';
import WalletButton from './WalletButton';
import { useConnectEthereum } from './useConnectEthereum';
import { ConnectionMode } from '../WalletSelector';
import { SupportedAuthMethod, supportedAuthMethods } from './supportedAuthMethods';
import { EthereumAuthenticateWallet } from './EthereumAuthenticateWallet';
import { EthereumAddWallet } from './EthereumAddWallet';
import { GnosisSafeAddWallet } from './GnosisSafeAddWallet';
import { GnosisSafeAuthenticateWallet } from './GnosisSafeAuthenticateWallet';
import { BaseM } from 'components/core/Text/Text';
import { TezosAuthenticateWallet } from './tezos/TezosAuthenticateWallet';
import useMultiKeyDown from 'hooks/useMultiKeyDown';
import { TezosAddWallet } from './tezos/TezosAddWallet';
import { useBeaconActions } from 'contexts/beacon/BeaconContext';
import { VStack } from 'components/core/Spacer/Stack';
import usePersistedState from 'hooks/usePersistedState';
import { TEZOS_EARLY_ACCESS_LOCAL_STORAGE_KEY } from 'utils/tezosEarlyAccess';

type Props = {
  connectionMode?: ConnectionMode;
  queryRef: MultichainWalletSelectorFragment$key;
};

export function MultichainWalletSelector({ connectionMode = AUTH, queryRef }: Props) {
  const query = useFragment(
    graphql`
      fragment MultichainWalletSelectorFragment on Query {
        ...EthereumAddWalletFragment
        ...GnosisSafeAddWalletFragment
        ...TezosAddWalletFragment
      }
    `,
    queryRef
  );

  const [selectedAuthMethod, setSelectedAuthMethod] = useState<SupportedAuthMethod>();

  const reset = useCallback(() => {
    setSelectedAuthMethod(undefined);
  }, []);

  const [tezosEnabled, setTezosEnabled] = usePersistedState<boolean>(
    TEZOS_EARLY_ACCESS_LOCAL_STORAGE_KEY,
    false
  );

  const handleToggleTezosButton = useCallback(() => {
    return setTezosEnabled(true);
  }, [setTezosEnabled]);

  useMultiKeyDown(['Shift', 't'], handleToggleTezosButton);

  const connectEthereum = useConnectEthereum();
  const { requestPermissions: connectTezos } = useBeaconActions();

  if (selectedAuthMethod === supportedAuthMethods.ethereum) {
    if (connectionMode === ADD_WALLET_TO_USER) {
      return (
        <StyledWalletSelector>
          <EthereumAddWallet queryRef={query} reset={reset} />
        </StyledWalletSelector>
      );
    }
    if (connectionMode === AUTH) {
      return (
        <StyledWalletSelector>
          <EthereumAuthenticateWallet reset={reset} />
        </StyledWalletSelector>
      );
    }
  }

  if (selectedAuthMethod === supportedAuthMethods.gnosisSafe) {
    if (connectionMode === ADD_WALLET_TO_USER) {
      return (
        <StyledWalletSelector>
          <GnosisSafeAddWallet queryRef={query} reset={reset} />
        </StyledWalletSelector>
      );
    }
    if (connectionMode === AUTH) {
      return (
        <StyledWalletSelector>
          <GnosisSafeAuthenticateWallet reset={reset} />
        </StyledWalletSelector>
      );
    }
  }

  if (selectedAuthMethod === supportedAuthMethods.tezos) {
    if (connectionMode === ADD_WALLET_TO_USER) {
      return (
        <StyledWalletSelector>
          <TezosAddWallet queryRef={query} reset={reset} />
        </StyledWalletSelector>
      );
    }
    if (connectionMode === AUTH) {
      return (
        <StyledWalletSelector>
          <TezosAuthenticateWallet reset={reset} />
        </StyledWalletSelector>
      );
    }
  }

  return (
    <StyledWalletSelector gap={24}>
      <VStack justify="center" gap={8}>
        <WalletButton
          label={supportedAuthMethods.ethereum.name}
          icon="ethereum"
          onClick={() => {
            console.log('connecting to ethereum');
            connectEthereum().then(
              (address) => {
                console.log('connected to ethereum with', address);
                setSelectedAuthMethod(supportedAuthMethods.ethereum);
              },
              (error) => {
                console.log('failed to connect to ethereum', error);
              }
            );
          }}
        />
        {connectionMode !== CONNECT_WALLET_ONLY ? (
          <WalletButton
            label={supportedAuthMethods.gnosisSafe.name}
            icon="gnosis_safe"
            onClick={() => {
              console.log('connecting to gnosis safe via walletconnect');
              setSelectedAuthMethod(supportedAuthMethods.gnosisSafe);
            }}
          />
        ) : null}
        <WalletButton
          label="Tezos"
          icon="tezos"
          disabled={!tezosEnabled}
          onClick={() => {
            console.log('connecting to tezos via beacon');
            connectTezos()
              .then((address) => {
                console.log('connected to tezos with', address);
                setSelectedAuthMethod(supportedAuthMethods.tezos);
              })
              .catch((error) => {
                console.log('failed to connect to tezos', error);
              });
          }}
        />
        <WalletButton label="Solana" icon="solana" disabled />
      </VStack>
      <BaseM>More chains coming soon™</BaseM>
    </StyledWalletSelector>
  );
}

const StyledWalletSelector = styled(VStack)`
  text-align: center;
  width: 320px;

  @media only screen and ${breakpoints.mobileLarge} {
    width: 400px;
    max-width: 480px;
  }
`;
