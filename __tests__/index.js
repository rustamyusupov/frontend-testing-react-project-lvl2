import { render, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '@hexlet/react-todo-app-with-backend';
import React from 'react';
import userEvent from '@testing-library/user-event';

const initialState = {
  currentListId: 1,
  lists: [{ id: 0, name: 'primary', removable: false }],
  tasks: [],
};

const server = setupServer(
  rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => {
    const task = {
      completed: false,
      id: 3,
      listId: Number(req.params.id),
      text: req.body.text,
      touched: 1622887145394,
    };

    return res(ctx.json(task));
  }),
);

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

  it('should create task', async () => {
    const { getByRole, getByText } = render(<App {...initialState} />);

    userEvent.type(getByRole('textbox', {  name: /new task/i}), 'test');
    userEvent.click(getByRole('button', {  name: /add/i}));

    expect(await waitFor(() => getByText('test'))).toBeInTheDocument();
  });  
});
