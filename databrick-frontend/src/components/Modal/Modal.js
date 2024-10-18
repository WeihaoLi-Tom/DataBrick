import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ className, children }) => {
    return (
        <div className={`${styles.modal} ${className}`}>
            <div className={`${styles.modalContent} ${className}-content`}>
                {children}
            </div>
        </div>
    );
};

export default Modal;