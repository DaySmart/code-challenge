import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/tasks';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/tasks', taskRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 