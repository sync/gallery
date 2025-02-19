import { SidebarTokensFragment$data } from '~/generated/SidebarTokensFragment.graphql';

export type CollectionGroup = {
  title: string;
  address: string;
  //      Remove the readonly
  tokens: Array<SidebarTokensFragment$data[number]>;
};

type groupCollectionsByAddressArgs = {
  //      Remove the readonly
  filteredTokensBySelectedWallet: SidebarTokensFragment$data;
  ignoreSpam?: boolean;
};

export function groupCollectionsByAddress({
  filteredTokensBySelectedWallet,
  ignoreSpam = false,
}: groupCollectionsByAddressArgs): CollectionGroup[] {
  const map: Record<string, CollectionGroup> = {};
  const tokens = filteredTokensBySelectedWallet ?? [];

  for (const token of tokens) {
    if (ignoreSpam) {
      if (token.isSpamByProvider || token.isSpamByUser) {
        continue;
      }
    }

    if (token.contract?.contractAddress?.address) {
      // Since POAP tokens don't have unique contracts, we give them
      // all a title of "POAP" and an address of "POAP"
      const title = token.chain === 'POAP' ? 'POAP' : token.contract.name || '<untitled>';
      const address = token.chain === 'POAP' ? 'POAP' : token.contract.contractAddress.address;

      const group = map[address] ?? {
        title,
        tokens: [],
        address: token.contract.contractAddress.address,
      };

      map[address] = group;

      group.tokens.push(token);
    }
  }

  return Object.values(map);
}
