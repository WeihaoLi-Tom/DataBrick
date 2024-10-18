import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom';
import ShowManagementPage from '../ShowManagementPage';

jest.mock('axios', () => {
    const mockedAxios = {
      create: jest.fn(() => mockedAxios), 
      get: jest.fn(),
      post: jest.fn(),
    };
    return mockedAxios;
  });

beforeEach(() => {
    // Set the userRole in localStorage to simulate an admin user
    localStorage.setItem('userRole', 'admin');
});

afterEach(() => {
    // Clean up the localStorage after each test
    localStorage.clear();
});

describe("ShowManagementPage", () => {
    test('Should render input element', async() => {
        render(
            <MemoryRouter initialEntries = {['/show-page-page']}>
                <ShowManagementPage />
            </MemoryRouter>
        );

        const inputElement = await screen.findByPlaceholderText(/Search for shows/i);
        fireEvent.change(inputElement,{target:{value:"Animal show"}});

        expect(inputElement.value).toBe("Animal show");
    })

    test('Filter by Status should default to "All"', async() => {
        render(
            <MemoryRouter>
                <ShowManagementPage />
            </MemoryRouter>
        );

        const statusDropdown = await screen.findByLabelText(/Filter by Status/i);

        expect(statusDropdown.value).toBe('All');
    });
})
