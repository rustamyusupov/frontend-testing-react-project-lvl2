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

const deleteTask = (text) => {
  userEvent.click(screen.getByRole('button', { name: 'Remove', exact: true }));

  return waitForElementToBeRemoved(screen.queryByText(text));
};

const createList = (name) => {
  const addButton = screen.getByRole('button', { name: /add list/i });

  userEvent.type(screen.getByRole('textbox', { name: /new list/i }), name);
  userEvent.click(addButton);

  return screen.findByText(name);
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
      await deleteTask('test');

      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });

  describe('list tests', () => {
    it('should create list', async () => {
      await createList('secondary');

      expect(await screen.findByText('secondary')).toBeInTheDocument();
    });

    it('should delete list', async () => {
      await createList('secondary');

      expect(await screen.findByText('secondary')).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: /remove list/i });

      userEvent.click(deleteButton);

      await waitFor(() => expect(screen.queryByText('secondary')).not.toBeInTheDocument());
    });

    it('shouldn\'t create list with same name', async () => {
      await createList('primary');

      expect(await screen.findByText(/already exists/i)).toBeVisible();
    });

    it('should delete task for specific list', async () => {
      await createTask('test');
      await createList('secondary');
      userEvent.click(screen.getByRole('button', { name: /secondary/i }));
      await createTask('test');

      expect(screen.getByText('test')).toBeVisible();

      await deleteTask('test');
      userEvent.click(screen.getByRole('button', { name: /primary/i }));

      expect(await screen.findByText('test')).toBeVisible();
    });
  });
});
