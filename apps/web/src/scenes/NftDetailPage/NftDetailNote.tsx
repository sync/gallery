import { KeyboardEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import breakpoints from '~/components/core/breakpoints';
import TextButton from '~/components/core/Button/TextButton';
import Markdown from '~/components/core/Markdown/Markdown';
import { HStack, VStack } from '~/components/core/Spacer/Stack';
import ErrorText from '~/components/core/Text/ErrorText';
import { BaseM, TitleXS } from '~/components/core/Text/Text';
import { AutoResizingTextAreaWithCharCount } from '~/components/core/TextArea/TextArea';
import { GLOBAL_FOOTER_HEIGHT } from '~/contexts/globalLayout/GlobalFooter/GlobalFooter';
import useUpdateNft from '~/hooks/api/tokens/useUpdateNft';
import { useTrack } from '~/shared/contexts/AnalyticsContext';
import formatError from '~/shared/errors/formatError';
import unescape from '~/shared/utils/unescape';

const MAX_CHAR_COUNT = 1200;

type NoteEditorProps = {
  nftCollectorsNote: string;
  tokenId: string;
  collectionId: string;
};

function NoteEditor({ nftCollectorsNote, tokenId, collectionId }: NoteEditorProps) {
  // Generic error that doesn't belong to collector's note
  const [generalError, setGeneralError] = useState('');

  const [isEditing, setIsEditing] = useState(false);

  const [collectorsNote, setCollectorsNote] = useState(nftCollectorsNote ?? '');
  const unescapedCollectorsNote = useMemo(() => unescape(collectorsNote), [collectorsNote]);

  const hasCollectorsNote = useMemo(() => collectorsNote.length > 0, [collectorsNote]);

  const collectorsNoteRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    if (collectorsNoteRef.current) {
      collectorsNoteRef.current.scrollIntoView({
        block: 'start',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, []);

  const handleEditCollectorsNote = useCallback(() => {
    setIsEditing(true);

    // Scroll down - wait so that element exists before scrolling to bottom of it
    setTimeout(() => {
      scrollDown();
    }, 200);
  }, [scrollDown]);

  const updateNft = useUpdateNft();

  const track = useTrack();

  const handleSubmitCollectorsNote = useCallback(async () => {
    setGeneralError('');

    if (unescapedCollectorsNote.length > MAX_CHAR_COUNT) {
      // No need to handle error here, since the form will mark the text as red
      return;
    }

    setIsEditing(false);

    try {
      await updateNft({ tokenId, collectorsNote, collectionId });
      track('Save NFT collectors note', {
        added_note: unescapedCollectorsNote.length > 0,
        num_chars: unescapedCollectorsNote.length,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setGeneralError(formatError(error));
      }
    }
  }, [updateNft, tokenId, collectorsNote, unescapedCollectorsNote, track, collectionId]);

  // If the user hits cmd + ctrl enter, submit the note
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    async (event) => {
      if (event.key === 'Enter' && event.metaKey) {
        event.preventDefault();
        await handleSubmitCollectorsNote();
      }
    },
    [handleSubmitCollectorsNote]
  );

  const handleNoteChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Scroll down as the user input goes off the screen
      // Need setTimeout so that textarea height is updated
      setTimeout(() => {
        scrollDown();
      }, 0);
      setCollectorsNote(event.target?.value);
    },
    [scrollDown]
  );

  return (
    <div onKeyDown={handleKeyDown} ref={collectorsNoteRef}>
      {/* Create a dummy textbox of the same height so that, when the element switches from the above to this one, there is not a jump to the top of the screen before scrollDown applies */}
      {isEditing ? (
        <StyledTextAreaWithCharCount
          footerHeight={GLOBAL_FOOTER_HEIGHT}
          onChange={handleNoteChange}
          placeholder="Tell us about your NFT..."
          defaultValue={unescapedCollectorsNote}
          currentCharCount={unescapedCollectorsNote.length}
          maxCharCount={MAX_CHAR_COUNT}
          showMarkdownShortcuts
          hasPadding
        />
      ) : (
        <StyledCollectorsNote
          footerHeight={GLOBAL_FOOTER_HEIGHT}
          onDoubleClick={handleEditCollectorsNote}
        >
          <Markdown text={collectorsNote} />
        </StyledCollectorsNote>
      )}
      {generalError && <StyledErrorText message={generalError} />}

      <VStack>
        {isEditing ? (
          <StyledSaveNoteButton justify="flex-end">
            <TextButton
              disabled={unescapedCollectorsNote.length > MAX_CHAR_COUNT}
              text="Save Note"
              onClick={handleSubmitCollectorsNote}
            />
          </StyledSaveNoteButton>
        ) : (
          <StyledEditNoteButtonContainer hasCollectorsNote={hasCollectorsNote}>
            <EditNoteButton
              text={hasCollectorsNote ? 'Edit' : 'Add Note'}
              onClick={handleEditCollectorsNote}
            />
          </StyledEditNoteButtonContainer>
        )}
      </VStack>
    </div>
  );
}

const StyledSaveNoteButton = styled(HStack)`
  padding-top: 12px;
`;

const StyledEditNoteButtonContainer = styled.div<{ hasCollectorsNote: boolean }>`
  padding-top: ${({ hasCollectorsNote }) => (hasCollectorsNote ? '8px' : '0px')};
`;

const EditNoteButton = styled(TextButton)`
  align-self: start;
`;

type NoteViewerProps = {
  nftCollectorsNote: string;
};

export function NoteViewer({ nftCollectorsNote }: NoteViewerProps) {
  return (
    <VStack gap={8}>
      <TitleXS>Collector&rsquo;s Note</TitleXS>
      <StyledCollectorsNote footerHeight={GLOBAL_FOOTER_HEIGHT}>
        <Markdown text={nftCollectorsNote} />
      </StyledCollectorsNote>
    </VStack>
  );
}

type Props = {
  nftCollectorsNote: string;
  tokenId: string;
  collectionId: string;
  authenticatedUserOwnsAsset: boolean;
};

function NftDetailNote({
  nftCollectorsNote,
  tokenId,
  collectionId,
  authenticatedUserOwnsAsset,
}: Props) {
  return (
    <StyledContainer footerHeight={GLOBAL_FOOTER_HEIGHT}>
      {authenticatedUserOwnsAsset ? (
        <NoteEditor
          nftCollectorsNote={nftCollectorsNote}
          tokenId={tokenId}
          collectionId={collectionId}
        />
      ) : (
        <NoteViewer nftCollectorsNote={nftCollectorsNote} />
      )}
    </StyledContainer>
  );
}

export const StyledContainer = styled.div<{ footerHeight: number }>`
  padding-top: 12px;
  // On tablet and smaller, the note will have the same styling as the NftDetailText (it will be directly on top of it)
  display: block;
  max-width: 296px;
  min-width: 296px;
  margin: auto;
  word-wrap: break-word;

  // On larger screens, the note will be sized according to its parent container and will be flush with the asset
  @media only screen and ${breakpoints.tablet} {
    width: 100%;
    min-width: 0;
    max-width: none;
    position: absolute; // So that it does not affect height of the flex container
  }

  // We only apply padding to account for footer, which is not fixed on mobile
  @media only screen and ${breakpoints.tablet} {
    padding-bottom: ${({ footerHeight }) =>
      footerHeight + 20}px; // 20px is roughly the height of character counter/Markdown container
  }
`;

type TextAreaProps = {
  footerHeight: number;
};

// These two are intentionally styled the same so that editing is seamless
const StyledTextAreaWithCharCount = styled(AutoResizingTextAreaWithCharCount)<TextAreaProps>`
  border: none;
  -ms-overflow-style: none;
  scrollbar-width: none;

  textarea {
    margin: 0;
    line-height: 20px;
    font-size: 14px;
    display: block;
    height: 100%;
    overflow: hidden;

    border-bottom: none;
    background: none;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

type CollectorsNoteProps = {
  footerHeight: number;
  isHidden?: boolean;
};

const StyledCollectorsNote = styled(BaseM)<CollectorsNoteProps>`
  height: 100%;

  :last-child {
    margin-bottom: 40px; /* line-height * 2, because textarea leaves one line at bottom + char count */
  }
`;

const StyledErrorText = styled(ErrorText)`
  padding-bottom: 8px;
`;

export default NftDetailNote;
