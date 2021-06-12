import React from 'react';
import App from '@hexlet/react-todo-app-with-backend';
import {
  render, waitFor, screen, waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import getServer from '../mocks/server';

const initialState = {
  currentListId: 1,
  lists: [{ id: 1, name: 'primary', removable: false }],
  tasks: [],
};

let server = getServer(initialState);

const createTask = (text) => {
  userEvent.type(screen.getByRole('textbox', { name: /new task/i }), text);
  userEvent.click(screen.getByRole('button', { name: 'Add', exact: true }));

  return screen.findByText(text);
};

beforeEach(async () => {
  const vdom = await App(initialState);

  server = getServer(initialState);
  server.listen({ onUnhandledRequest: 'warn' });

  render(vdom);
});
afterEach(() => {
  server.resetHandlers();
  server.close();
});

describe('todo test', () => {
  it('should render application', () => {
    expect(screen.getByText('Hexlet Todos')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /new list/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /new task/i })).toBeInTheDocument();
  });

  describe('task tests', () => {
    it('should create task', async () => {
      await createTask('test');

      expect(screen.getByText('test')).toBeVisible();
    });

    it('should checked task', async () => {
      await createTask('test');
      userEvent.click(screen.getByRole('checkbox', { name: /test/i }));

      expect(await screen.findByRole('checkbox', { name: /test/i })).toBeVisible();
      expect(await screen.findByRole('checkbox', { name: /test/i })).toBeChecked();
    });

    it('should delete task', async () => {
      await createTask('test');
      userEvent.click(screen.getByRole('button', { name: /remove/i }));
      await waitForElementToBeRemoved(screen.queryByText('test'));

      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });

  it.skip('should delete task for specific list', async () => {
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

  it.skip('should delete/create list', async () => {
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

    userEvent.click(deleteButton);

    await waitFor(() => expect(screen.queryByText('secondary')).toBeNull());

    userEvent.type(screen.getByRole('textbox', { name: /new list/i }), 'secondary');
    userEvent.click(addButton);

    await waitFor(() => expect(screen.queryByText('secondary')).toBeVisible());

    userEvent.click(screen.getByRole('button', { name: /secondary/i }));

    await waitFor(() => expect(screen.queryByText('test')).toBeNull());
  });

  it.skip('should create list with same name', async () => {
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
