import React from 'react';
import NoAccessMessage from './NoAccessMessage';

const AccessControlWrapper = ({ hasAccess, children, blank = false }) => {
    // Only displays children if hasAccess is set to true
    return hasAccess ? (
        <div>{children}</div>
    ) : (
        <>{!blank  && (<NoAccessMessage />)}</>
    );
};

export default AccessControlWrapper;
