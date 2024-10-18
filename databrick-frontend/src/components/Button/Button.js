import React from 'react';
import styles from './Button.module.css';

const Button = ({ className, label, onClick, disabled, size }) => {
    const buttonClass = `${styles.button} ${className} ${size === 'large' ? styles.large : ''}`

    return (
        <button className={buttonClass} onClick={onClick} disabled={disabled}>
            {label}
        </button>
    );
};

export default Button;