import { state } from '../state/state';
import getQueryEditorTextarea from '../../page_elements/getQueryEditorTextarea';
import deleteTextInputElement from '../../utils/deleteTextInputElement';

export const pushPreviousQueryContent = (): void => {
    const queryEditorTextarea = getQueryEditorTextarea(state.version);
    state.previousQueryContents.push(state.storeQueryContent);
    deleteTextInputElement(queryEditorTextarea, state.storeQueryContent);
};
