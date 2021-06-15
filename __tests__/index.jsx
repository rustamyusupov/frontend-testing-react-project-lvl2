import App from '@hexlet/react-todo-app-with-backend';
import {
  render, waitFor, screen, waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';

import getServer from '../mocks/server';

let server = getServer();

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
  const initialState = {
    currentListId: 1,
    lists: [{ id: 1, name: 'primary', removable: false }],
    tasks: [],
  };
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

      expect(screen.queryByText('test')).toBeInTheDocument();
    });

    it('should checked task', async () => {
      await createTask('test');

      const checkbox = screen.getByRole('checkbox', { name: /test/i });

      expect(checkbox).not.toBeChecked();

      userEvent.click(checkbox);

      expect(checkbox).toBeDisabled();
      await waitFor(() => expect(checkbox).toBeChecked());
      expect(checkbox).toBeEnabled();
    });

    it('should delete task', async () => {
      await createTask('test');
      await deleteTask('test');

      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should disable field and button', async () => {
      const textbox = screen.getByRole('textbox', { name: /new task/i });
      const button = screen.getByRole('button', { name: 'Add', exact: true });

      server.use(
        rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => res(
          ctx.delay(1000),
          ctx.json({
            id: 0,
            listId: Number(req.params.id),
            text: req.body.text,
            completed: false,
            touched: Date.now(),
          }),
        )),
      );

      userEvent.type(screen.getByRole('textbox', { name: /new task/i }), 'test');
      userEvent.click(screen.getByRole('button', { name: 'Add', exact: true }));

      await waitFor(() => expect(textbox).toHaveAttribute('readonly'));
      expect(button).toBeDisabled();
      expect(await screen.findByText('test')).toBeVisible();
    });

    it('should prevent create task when error', async () => {
      server.use(rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => res(ctx.status(500))));

      userEvent.type(screen.getByRole('textbox', { name: /new task/i }), 'test');
      userEvent.click(screen.getByRole('button', { name: 'Add', exact: true }));

      await waitFor(() => {
        expect(screen.queryByText('test')).not.toBeInTheDocument();
        expect(screen.queryByText(/network error/i)).toBeVisible();
      });
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

      expect(screen.queryByText('test')).toBeInTheDocument();

      await deleteTask('test');
      userEvent.click(screen.getByRole('button', { name: /primary/i }));

      expect(screen.queryByText('test')).toBeInTheDocument();
    });

    it('shouldn\'t return same tasks for recovered list', async () => {
      await createList('secondary');

      userEvent.click(screen.getByRole('button', { name: /secondary/i }));
      await createTask('test');
      expect(screen.queryByText('test')).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: /remove list/i });
      userEvent.click(deleteButton);
      await waitFor(() => expect(screen.queryByText('secondary')).not.toBeInTheDocument());

      await createList('secondary');
      userEvent.click(screen.getByRole('button', { name: /secondary/i }));
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });
});
