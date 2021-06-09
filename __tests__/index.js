import { render, waitFor, screen } from '@testing-library/react';
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
  rest.post('/api/v1/lists', (req, res, ctx) => {
    const list = { id: 3, name: req.body.name, removable: true };

    return res(ctx.json(list));
  }),
  rest.delete('/api/v1/lists/:id', (req, res, ctx) => res(ctx.status(204))),
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
  rest.delete('/api/v1/tasks/:id', (req, res, ctx) => res(ctx.status(204))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('todo test', () => {
  it('should render application', () => {
    render(<App />);

    expect(screen.getByText('Hexlet Todos')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /new list/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /new task/i })).toBeInTheDocument();
  });

  it('should create task', async () => {
    render(<App {...initialState} />);

    userEvent.type(screen.getByRole('textbox', { name: /new task/i }), 'test');
    userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(await waitFor(() => screen.getByText('test'))).toBeInTheDocument();
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
        },
      ],
    };
    render(<App { ...preloadedState } />);

    userEvent.click(screen.getByRole('checkbox', { name: 'test' }));

    expect(await screen.findByRole('checkbox', { name: /test/i })).toBeVisible();
    expect(await screen.findByRole('checkbox', { name: /test/i })).toBeChecked();
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
        },
      ],
    };
    render(<App { ...preloadedState } />);

    expect(await screen.findByText('for delete')).toBeVisible();
    userEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.queryByText('for delete')).toBeNull());
  });

  it('should delete task for specific list', async () => {
    const preloadedState = {
      ...initialState,
      lists: [
        ...initialState.lists,
        { id: 2, name: 'secondary', removable: true },
      ],
      tasks: [
        {
          id: 1,
          listId: 1,
          text: 'for delete',
          completed: true,
          touched: Date.now(),
        },
        {
          id: 2,
          listId: 2,
          text: 'test2',
          completed: true,
          touched: Date.now(),
        },
      ],
    };
    render(<App { ...preloadedState } />);

    expect(await screen.findByText('for delete')).toBeVisible();
    userEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.queryByText('for delete')).toBeNull());

    userEvent.click(screen.getByRole('button', { name: /secondary/i }));

    expect(await screen.findByText('test2')).toBeVisible();
  });

  it('should delete/create list', async () => {
    const preloadedState = {
      ...initialState,
      lists: [
        ...initialState.lists,
        { id: 2, name: 'secondary', removable: true },
      ],
      tasks: [
        {
          id: 1,
          listId: 2,
          text: 'test',
          completed: true,
          touched: Date.now(),
        },
      ],
    };
    const { container } = render(<App { ...preloadedState } />);
    const deleteButton = container.querySelector('.col-3 > ul > li:last-child > div > button:last-child');
    const addButton = container.querySelector('.col-3 > form > div > button');
    // update backend, replace container to query like getByRole

    userEvent.click(deleteButton);

    await waitFor(() => expect(screen.queryByText('secondary')).toBeNull());

    userEvent.type(screen.getByRole('textbox', { name: /new list/i }), 'secondary');
    userEvent.click(addButton);

    await waitFor(() => expect(screen.queryByText('secondary')).toBeVisible());

    userEvent.click(screen.getByRole('button', { name: /secondary/i }));

    await waitFor(() => expect(screen.queryByText('test')).toBeNull());
  });

  it('should create list with same name', async () => {
    const preloadedState = {
      ...initialState,
      tasks: [
        {
          id: 1,
          listId: 1,
          text: 'test',
          completed: false,
          touched: Date.now(),
        },
      ],
    };
    const { container } = render(<App { ...preloadedState } />);
    const addButton = container.querySelector('.col-3 > form > div > button');

    userEvent.type(screen.getByRole('textbox', { name: /new list/i }), 'primary');
    userEvent.click(addButton);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /primary/i })).toHaveLength(2));

    userEvent.click(screen.getAllByRole('button', { name: /primary/i })[1]);
    await waitFor(() => expect(screen.queryByText('test')).toBeNull());
  });
});
