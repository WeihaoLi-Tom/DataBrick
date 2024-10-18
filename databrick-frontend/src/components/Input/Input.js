import React from 'react';
import styles from './Input.module.css';

const Input = ({ className, value, onChange, placeholder, disabled, size, accept, type = 'text' }) => {
    const inputClass = `${styles.input} ${className} ${size === 'large' ? styles.large : ''}`;

    return (
        <input
            type={type}
            className={inputClass}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            accept={accept}
        />
    );
};

export default Input;