export const clearAndPasteContent = async (content: string): Promise<boolean> => {
  const textarea = document.querySelector('textarea.ace_text-input');
  if (!textarea) return false;

  // Simulate select all (Ctrl+A)
  const selectAllEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 65,
    ctrlKey: true
  });
  textarea.dispatchEvent(selectAllEvent);

  // Simulate delete key press
  const deleteEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 46, // Delete key
  });
  textarea.dispatchEvent(deleteEvent);

  // Wait for delete to process
  await new Promise(resolve => setTimeout(resolve, 100));

  // Paste new content
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', content);
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: clipboardData,
    bubbles: true,
    cancelable: true,
  });
  textarea.dispatchEvent(pasteEvent);

  return true;
};

export const clickRunButton = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let hasClicked = false;
    const checkButton = setInterval(() => {
      // either .RunButton.Button--primary or RunButton.Button but no --hidden
      const runButton = document.querySelector('.RunButton.Button:not(.Button--hidden), .RunButton.Button--primary:not(.Button--hidden)');
      if (runButton && !hasClicked) {
        hasClicked = true;
        clearInterval(checkButton);
        setTimeout(() => {
          (runButton as HTMLElement).click();
          resolve(true);
        }, 500);
      }
    }, 100);

    // Cleanup after 10 seconds
    setTimeout(() => {
      if (!hasClicked) {
        clearInterval(checkButton);
        resolve(false);
      }
    }, 10000);
  });
};