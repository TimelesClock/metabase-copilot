// pageScript.ts
interface MetabaseQuestion {
    id: () => string;
    displayName: () => string;
    description: () => string;
    display: () => string;
    settings: () => any;
    clone: () => MetabaseQuestion;
    setDisplayName: (name: string) => MetabaseQuestion;
    setDescription: (desc: string) => MetabaseQuestion;
    setDisplay: (display: string) => MetabaseQuestion;
    setSettings: (settings: any) => MetabaseQuestion;
    setDisplayIsLocked: (locked: boolean) => MetabaseQuestion;
    query: () => { isEditable: () => boolean };
    update: (arg: null, options: { reload: boolean; shouldUpdateUrl: boolean }) => Promise<void>;
}

interface QuestionUpdates {
    name?: string;
    description?: string;
    display?: string;
    visualization_settings?: Record<string, any>;
}

(() => {
    const MetabaseHelper = {
        updateQuestion: function(updates: QuestionUpdates): Promise<void> {
            return new Promise((resolve, reject) => {
                try {
                    console.log('Finding React Fiber and updating question...');
                    
                    // Find question instance directly
                    const element = document.querySelector('[data-testid="native-query-top-bar"]');
                    if (!element) {
                        reject(new Error('Target element not found'));
                        return;
                    }

                    // Get React fiber key
                    const fiberKey = Object.keys(element).find(key => 
                        key.startsWith('__reactFiber$') || 
                        key.startsWith('__reactInternalInstance$')
                    );

                    if (!fiberKey) {
                        reject(new Error('React fiber key not found'));
                        return;
                    }

                    let currentFiber = (element as any)[fiberKey];
                    let questionInstance: MetabaseQuestion | null = null;
                    let depth = 0;

                    // Traverse up the fiber tree to find question instance
                    while (currentFiber && depth < 20) {
                        
                        // Check memoizedProps first
                        if (currentFiber.memoizedProps?.question) {
                            const candidate = currentFiber.memoizedProps.question;
                            if (typeof candidate.id === 'function') {
                                questionInstance = candidate;
                                break;
                            }
                        }

                        // Check stateNode props
                        if (currentFiber.stateNode?.props?.question) {
                            const candidate = currentFiber.stateNode.props.question;
                            if (typeof candidate.id === 'function') {
                                questionInstance = candidate;
                                break;
                            }
                        }

                        currentFiber = currentFiber.return;
                        depth++;
                    }

                    if (!questionInstance) {
                        reject(new Error('Question instance not found in component tree'));
                        return;
                    }

                    // Create updated question from found instance

                    let updatedQuestion = questionInstance.clone();
                    
                    if (updates.name) {

                        updatedQuestion = updatedQuestion.setDisplayName(updates.name);
                    }
                    
                    if (updates.description) {

                        updatedQuestion = updatedQuestion.setDescription(updates.description);
                    }
                    
                    if (updates.display) {

                        updatedQuestion = updatedQuestion.setDisplay(updates.display)
                            .setDisplayIsLocked(true);
                    }
                    
                    if (updates.visualization_settings) {

                        updatedQuestion = updatedQuestion.setSettings({
                            ...questionInstance.settings(),
                            ...updates.visualization_settings
                        });
                    }

                    // Apply the updates
                    updatedQuestion.update(null, {
                        reload: false,
                        shouldUpdateUrl: updatedQuestion.query().isEditable()
                    })


                } catch (error) {
                    console.error('Error in updateQuestion:', error);
                    reject(error);
                }
            });
        }
    };

    // Expose the methods to window
    (window as any).MetabaseHelper = MetabaseHelper;
})();

export {};