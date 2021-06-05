import { render, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '@hexlet/react-todo-app-with-backend';
import React from 'react';
import userEvent from '@testing-library/user-event';

const initialState = {
  currentListId: 1,
  lists: [{ id: 1, name: 'primary', removable: false }],
  tasks: [],
};

const server = setupServer(
  rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => {
    const task = {
      id: 1,
      listId: 1,
      text: req.body.text,
      completed: false,
      touched: Date.now(),
    };

    return res(ctx.json(task));
  }),
  rest.patch('/api/v1/tasks/:id', (req, res, ctx) => {
    const task = {
      id: 1,
      listId: 1,
      completed: req.body.completed,
      touched: Date.now(),
    };

    return res(ctx.json(task));
  }),
  rest.delete('/api/v1/tasks/:id', (req, res, ctx) => {
    return res(ctx.status(204));
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

  it('should checked task', async () => {
    const preloadedState = {
      ...initialState,
      tasks: [
        {
          id: 1,
          listId: 1,
          text: 'test',
          completed: false,
          touched: Date.now(),
        }
      ]
    };
    const { getByRole, findByRole } = render(<App { ...preloadedState } />);

    userEvent.click(getByRole('checkbox', { name: 'test' }));

    expect(await findByRole('checkbox', { name: 'test' })).toBeVisible();
    expect(await findByRole('checkbox', { name: 'test' })).toBeChecked();
  });
  
  it('should delete task', async () => {
    const preloadedState = {
      ...initialState,
      tasks: [
        {
          id: 1,
          listId: 1,
          text: 'for delete',
          completed: true,
          touched: Date.now(),
        }
      ]
    };
    const { getByRole, findByText, getByText } = render(<App { ...preloadedState } />);

    userEvent.click(getByRole('button', { name: 'Remove' }));
    await waitFor(() => getByRole('heading', { name: 'Tasks' }));

    expect(await waitFor(() => getByText('for delete'))).not.toBeInTheDocument();
  });  
});
