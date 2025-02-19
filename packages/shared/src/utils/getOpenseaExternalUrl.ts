export const GALLERY_OS_ADDRESS = '0x8914496dc01efcc49a2fa340331fb90969b6f1d2';

// The backend converts all token IDs to hexadecimals; here, we convert back
// https://stackoverflow.com/a/53751162
export const hexHandler = (str: string) => {
  if (str.length % 2) {
    str = '0' + str;
  }

  const bn = BigInt('0x' + str);
  const d = bn.toString(10);
  return d;
};

export const getOpenseaExternalUrl = (
  chainStr: string,
  contractAddress: string,
  tokenId: string
) => {
  const chain = chainStr.toLocaleLowerCase();
  const hexTokenId = hexHandler(tokenId);

  return `https://opensea.io/assets/${chain}/${contractAddress}/${hexTokenId}`;
};
