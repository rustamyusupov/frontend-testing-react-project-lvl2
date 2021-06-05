import { render } from '@testing-library/react';
import App from '@hexlet/react-todo-app-with-backend';
import React from 'react';

describe('todo test', () => {
  it('should render application', () => {
    const { getByText, getByRole } = render(<App />);

    expect(getByText('Hexlet Todos')).toBeInTheDocument();
    expect(getByRole('textbox', {  name: /new list/i})).toBeInTheDocument();
    expect(getByRole('textbox', {  name: /new task/i})).toBeInTheDocument();
  });  
});
