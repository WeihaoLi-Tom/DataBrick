import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ControlPanel.module.css';

import { AccessControlWrapper } from './components/NoAccess';

const ControlPanel = () => {
    const role = localStorage.getItem('userRole');

    // Function to determine if user should have access
    function adminAccess() {
        // Only allow admin access
        return (role === 'admin');
    }

    return (
        <div className={styles.controlPanel}>
            <h1 className={styles.heading}>Control Panel</h1>
            <div className={styles.grid}>
                <Link to="/login-page" className={styles.card}>
                    <h2>Login Page</h2>
                    <p>Login / logout +<br/>Change your password.</p>
                </Link>
                <Link to="/show-page" className={styles.card}>
                    <h2>{adminAccess() ? 'Show Management' : 'My Shows'}</h2>
                    <p>{adminAccess() ? 'Manage all shows and artist assignment.' : 'View and design your shows.'}</p>
                </Link>
                <AccessControlWrapper hasAccess={adminAccess()}  blank={true}>
                    <Link to="/brick-page" className={styles.card}>
                        <h2>Brick Management</h2>
                        <p>View and update brick statuses.</p>
                    </Link>
                </AccessControlWrapper>
                <AccessControlWrapper hasAccess={adminAccess()}  blank={true}>
                    <Link to="/artist-management" className={styles.card}>
                        <h2>Invite Artists</h2>
                        <p>Invite and uninvite artists to the system.</p>
                    </Link>
                </AccessControlWrapper>
            </div>
        </div>
    );
};

export default ControlPanel;
