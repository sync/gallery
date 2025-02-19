import { View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  htmlUrl: string;
  onLoad: () => void;
};

export function NftDetailAssetHtml({ onLoad, htmlUrl }: Props) {
  return (
    <View style={{ width: '100%', aspectRatio: 1 }}>
      <WebView
        onLoadEnd={onLoad}
        originWhitelist={['*']}
        className="h-full w-full bg-transparent"
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={{ uri: htmlUrl }}
      />
    </View>
  );
}
