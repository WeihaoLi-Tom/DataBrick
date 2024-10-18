import React from 'react';
import styles from './DeleteButton.module.css'; 
import Button from './Button'; 

const DeleteButton = ({ className, onClick, disabled, label}) => {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            className={`${styles.deleteButton} ${className}`} 
            label={label ? label : "Delete"} 
        />
    );
};

export default DeleteButton;