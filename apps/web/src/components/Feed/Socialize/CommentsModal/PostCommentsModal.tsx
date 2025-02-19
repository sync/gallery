import { useCallback, useMemo } from 'react';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';

import { PostCommentsModalFragment$key } from '~/generated/PostCommentsModalFragment.graphql';
import { PostCommentsModalQueryFragment$key } from '~/generated/PostCommentsModalQueryFragment.graphql';
import useCommentOnPost from '~/hooks/api/posts/useCommentOnPost';
import getOptimisticUserInfo from '~/utils/getOptimisticUserInfo';

import { CommentsModal } from './CommentsModal';
type Props = {
  postRef: PostCommentsModalFragment$key;
  queryRef: PostCommentsModalQueryFragment$key;
  fullscreen: boolean;
};
export default function PostCommentsModal({ postRef, queryRef, fullscreen }: Props) {
  const {
    data: post,
    loadPrevious,
    hasPrevious,
  } = usePaginationFragment(
    graphql`
      fragment PostCommentsModalFragment on Post
      @refetchable(queryName: "PostCommentsModalRefetchableFragment") {
        interactions(last: $interactionsFirst, before: $interactionsAfter)
          @connection(key: "CommentsModal_interactions") {
          edges {
            node {
              __typename

              ... on Comment {
                ...CommentsModalFragment
              }
            }
          }
        }
        id
        dbid
      }
    `,
    postRef
  );

  const query = useFragment(
    graphql`
      fragment PostCommentsModalQueryFragment on Query {
        ...getOptimisticUserInfoQueryFragment
        ...CommentsModalQueryFragment
      }
    `,
    queryRef
  );

  const [commentOnPost, isSubmittingComment] = useCommentOnPost();

  const nonNullInteractions = useMemo(() => {
    const interactions = [];

    for (const interaction of post.interactions?.edges ?? []) {
      if (interaction?.node && interaction.node.__typename === 'Comment') {
        interactions.push(interaction.node);
      }
    }

    return interactions.reverse();
  }, [post.interactions?.edges]);

  const handleSubmitComment = useCallback(
    (comment: string) => {
      commentOnPost(post.id, post.dbid, comment, getOptimisticUserInfo(query));
    },
    [commentOnPost, post.dbid, post.id, query]
  );

  return (
    <CommentsModal
      commentsRef={nonNullInteractions}
      queryRef={query}
      fullscreen={fullscreen}
      hasPrevious={hasPrevious}
      loadPrevious={loadPrevious}
      onSubmitComment={handleSubmitComment}
      isSubmittingComment={isSubmittingComment}
    />
  );
}
