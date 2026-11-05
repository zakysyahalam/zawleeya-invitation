import 'dotenv/config';
import app from './server/app';
const port = Number(process.env.API_PORT || 3001);
app.listen(port, () => console.log(`Wedding API ready at http://localhost:${port}`));
