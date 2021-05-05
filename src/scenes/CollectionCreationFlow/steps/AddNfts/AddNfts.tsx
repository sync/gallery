import { useEffect } from 'react';
import { WizardContext } from 'react-albus';
import styled from 'styled-components';

import CollectionNamingForm from './CollectionNamingForm';
import CollectionEditor from './Editor/CollectionEditor';

import { useWizardCallback } from 'contexts/wizard/WizardCallbackContext';
import CollectionEditorProvider from 'contexts/collectionEditor/CollectionEditorContext';
import { useModal } from 'contexts/modal/ModalContext';

type ConfigProps = {
  onNext: WizardContext['next'];
};

function useWizardConfig({ onNext }: ConfigProps) {
  const { setOnNext } = useWizardCallback();
  const { showModal } = useModal();

  useEffect(() => {
    setOnNext(() => showModal(<CollectionNamingForm onNext={onNext} />));

    return () => setOnNext(undefined);
  }, [setOnNext, showModal, onNext]);
}

function AddNfts({ next }: WizardContext) {
  useWizardConfig({ onNext: next });

  return (
    <StyledAddNfts>
      <CollectionEditorProvider>
        <CollectionEditor />
      </CollectionEditorProvider>
    </StyledAddNfts>
  );
}

const StyledAddNfts = styled.div`
  display: flex;
`;

export default AddNfts;
