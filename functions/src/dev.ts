import { app } from './api/app';

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor API local ejecutándose en http://localhost:${PORT}`);
});
