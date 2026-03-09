import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    // Stores the current state of whatever page the user is on
    const [screenContext, setScreenContext] = useState({});
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

    return (
        <ChatContext.Provider value={{
            screenContext, setScreenContext,
            isAdvisorOpen, setIsAdvisorOpen
        }}>
            {children}
        </ChatContext.Provider>
    );
};
