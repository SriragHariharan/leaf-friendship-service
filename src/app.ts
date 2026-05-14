import express from 'express';

const app = express();

app.use(express.json());

const port = Number(process.env.PORT) || 4042;

app.listen(port, () => {
  console.log(`Friends service is running on port ${port}`);
});
