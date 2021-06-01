import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/react';
import { setupServer } from 'msw/node';
import App from '@hexlet/react-todo-app-with-backend';
import React from 'react';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('todo test', () => {
  it('should render application', () => {
    const { getByText, getByRole } = render(<App />);

    expect(getByText('Hexlet Todos')).toBeInTheDocument();
    expect(getByRole('textbox', {  name: /new list/i})).toBeInTheDocument();
    expect(getByRole('textbox', {  name: /new task/i})).toBeInTheDocument();
  });
});
