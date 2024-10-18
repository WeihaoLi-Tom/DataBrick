import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage'

jest.mock('axios', () => {
    const mockedAxios = {
      create: jest.fn(() => mockedAxios), 
      get: jest.fn(),
      post: jest.fn(),
    };
    return mockedAxios;
  });

describe("LoginPage", () => {
    test('Should render input element', () => {
        render(
            <MemoryRouter initialEntries = {['/login-page']}>
                <LoginPage />
            </MemoryRouter>
        );

        const inputElement = screen.getByPlaceholderText(/Username/i);
        fireEvent.change(inputElement,{target:{value:"John"}});
        
        expect(inputElement.value).toBe("John");
    })

    test('password input should be of type password', () => {
        render(
            <MemoryRouter>
                <LoginPage initialEntries = {['/login-page']}/>
            </MemoryRouter>
        );

        const passwordInput = screen.getByPlaceholderText(/Password/i);

        expect(passwordInput).toHaveAttribute('type', 'password');
    });
})
