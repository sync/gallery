import { graphql, loadQuery, PreloadedQuery, usePreloadedQuery } from 'react-relay';

import { ITEMS_PER_PAGE, MAX_PIECES_DISPLAYED_PER_FEED_EVENT } from '~/components/Feed/constants';
import { NOTES_PER_PAGE } from '~/components/Feed/Socialize/CommentsModal/CommentsModal';
import { HomeNavbar } from '~/contexts/globalLayout/GlobalNavbar/HomeNavbar/HomeNavbar';
import { StandardSidebar } from '~/contexts/globalLayout/GlobalSidebar/StandardSidebar';
import { homePageCuratedQuery } from '~/generated/homePageCuratedQuery.graphql';
import GalleryRoute from '~/scenes/_Router/GalleryRoute';
import TrendingHomePage from '~/scenes/Home/TrendingHomePage';
import { PreloadQueryArgs } from '~/types/PageComponentPreloadQuery';
import isProduction from '~/utils/isProduction';

const homePageCuratedQueryNode = graphql`
  query homePageCuratedQuery(
    $interactionsFirst: Int!
    $interactionsAfter: String
    $curatedLast: Int!
    $curatedBefore: String
    $globalLast: Int!
    $globalBefore: String
    $visibleTokensPerFeedEvent: Int! # [GAL-3763] Revive this if / when elon lets us import twitter follower graphs again # $twitterListFirst: Int! # $twitterListAfter: String
    $includePosts: Boolean!
  ) {
    ...TrendingHomePageFragment
    ...HomeNavbarFragment
    # [GAL-3763] Revive this if / when elon lets us import twitter follower graphs again
    # ...useOpenTwitterFollowingModalFragment
    ...StandardSidebarFragment
  }
`;

type Props = {
  preloadedQuery: PreloadedQuery<homePageCuratedQuery>;
};

export default function Home({ preloadedQuery }: Props) {
  const query = usePreloadedQuery(homePageCuratedQueryNode, preloadedQuery);

  // [GAL-3763] Revive this if / when elon lets us import twitter follower graphs again
  // useOpenTwitterFollowingModal(query);

  return (
    <GalleryRoute
      navbar={<HomeNavbar queryRef={query} />}
      sidebar={<StandardSidebar queryRef={query} />}
      element={<TrendingHomePage queryRef={query} />}
    />
  );
}

Home.preloadQuery = ({ relayEnvironment }: PreloadQueryArgs) => {
  const includePosts = !isProduction();
  return loadQuery<homePageCuratedQuery>(
    relayEnvironment,
    homePageCuratedQueryNode,
    {
      interactionsFirst: NOTES_PER_PAGE,
      globalLast: ITEMS_PER_PAGE,
      curatedLast: ITEMS_PER_PAGE,
      visibleTokensPerFeedEvent: MAX_PIECES_DISPLAYED_PER_FEED_EVENT,
      includePosts,
      // [GAL-3763] Revive this if / when elon lets us import twitter follower graphs again
      // twitterListFirst: USER_PER_PAGE,
    },
    { fetchPolicy: 'store-or-network' }
  );
};

/**
 * Wacky bugfix that addresses a bizarre inconsistency in the NextJS router.
 *
 * If a page *does not* export `getServerSideProps`, returning to the page triggers a
 * NextJS route change BEFORE the browser believes it has transitioned via `window.popState`.
 *
 * However, exporting `getServerSideProps` for some reason ensures the browser's `popState`
 * fires BEFORE the NextJS route change, which is necessary behavior for our FadeTransitioner.
 * This is because our FadeTransitioner depends on listening to the `popState` signal to
 * schedule a graceful scroll restoration before the transition begins.
 *
 * To summarize:
 *
 * WITHOUT getServerSideProps:
 *   1) click back button
 *   2) nextJS route change
 *   3) transition begins
 *   4) immediately visible scroll jank
 *   5) browser popState fires late
 *   6) transition ends
 *
 * WITH    getServerSideProps:
 *   1) click back button
 *   2) browser popState fires
 *   3) scroll position is scheduled to fire later
 *   4) nextJS route change
 *   5) transition begins
 *   6) scroll restoration while screen is opaque (jank is invisible to user)
 *   7) transition ends
 */
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
