import { rest } from 'msw';
import { setupServer } from 'msw/node';

const getNextId = (list = []) => {
  const lastId = list.slice(-1)?.[0]?.id;
  const newId = lastId + 1 || 0;

  return newId;
};

const getServer = (initialState = {}) => {
  let { lists = [], tasks = [] } = initialState;

  const handlers = [
    rest.post('/api/v1/lists', (req, res, ctx) => {
      const newId = getNextId(lists);
      const list = { id: newId, name: req.body.name, removable: true };

      lists = [...lists, list];

      return res(ctx.json(list));
    }),
    rest.delete('/api/v1/lists/:id', (req, res, ctx) => {
      lists = lists.filter((list) => list.id === req.params.id);

      return res(ctx.status(204));
    }),
    rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => {
      const newId = getNextId(tasks);
      const task = {
        id: newId,
        listId: req.params.listId,
        text: req.body.text,
        completed: false,
        touched: Date.now(),
      };

      tasks = [...tasks, task];

      return res(ctx.json(task));
    }),
    rest.patch('/api/v1/tasks/:id', (req, res, ctx) => {
      const checkedTask = {
        id: req.params.taskId,
        listId: req.params.listId,
        completed: req.body.completed,
        touched: Date.now(),
      };

      tasks = tasks.map((task) => (task.id === req.params.taskId ? checkedTask : task));

      return res(ctx.json(checkedTask));
    }),
    rest.delete('/api/v1/tasks/:id', (req, res, ctx) => {
      tasks = tasks.filter(({ id }) => id !== req.params.taskId);

      return res(ctx.status(204));
    }),
  ];

  const server = setupServer(...handlers);

  return server;
};

export default getServer;
